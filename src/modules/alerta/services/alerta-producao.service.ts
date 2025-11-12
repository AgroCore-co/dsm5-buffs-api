import { Injectable, Logger } from '@nestjs/common';
import { AlertasService } from '../alerta.service';
import { ProducaoRepository } from '../repositories/producao.repository';
import { BufaloRepository } from '../repositories/bufalo.repository';
import { CreateAlertaDto, NichoAlerta, PrioridadeAlerta } from '../dto/create-alerta.dto';
import { AlertaConstants, formatarDataBR } from '../utils/alerta.constants';

/**
 * Serviço de domínio para alertas de PRODUÇÃO.
 * Contém toda a lógica de negócio para verificação de:
 * - Queda de produção de leite
 *
 * Responsabilidade: Lógica de negócio de alertas de produção.
 */
@Injectable()
export class AlertaProducaoService {
  private readonly logger = new Logger(AlertaProducaoService.name);

  constructor(
    private readonly alertasService: AlertasService,
    private readonly producaoRepo: ProducaoRepository,
    private readonly bufaloRepo: BufaloRepository,
  ) {}

  /**
   * Verifica quedas significativas na produção de leite.
   * Compara média dos últimos 7 dias com média dos 30 dias anteriores.
   */
  async verificarQuedaProducao(id_propriedade?: string): Promise<number> {
    this.logger.log(`Verificando queda de produção${id_propriedade ? ` para propriedade ${id_propriedade}` : ''}...`);

    try {
      // Buscar IDs dos búfalos da propriedade se fornecida
      let ids_bufalos: string[] | undefined;
      if (id_propriedade) {
        const { data: bufalos } = await this.bufaloRepo.buscarIdsBufalosPorPropriedade(id_propriedade);
        ids_bufalos = bufalos?.map((b: any) => b.id_bufalo);
        if (!ids_bufalos || ids_bufalos.length === 0) {
          this.logger.log('Nenhum búfalo encontrado na propriedade.');
          return 0;
        }
      }

      // Buscar produções dos últimos 37 dias (7 recentes + 30 histórico)
      const diasTotal = AlertaConstants.DIAS_ANALISE_PRODUCAO_RECENTE + AlertaConstants.DIAS_ANALISE_PRODUCAO_HISTORICO;
      const { data: producoes, error } = await this.producaoRepo.buscarProducoesRecentes(diasTotal);

      if (error || !producoes || producoes.length === 0) {
        this.logger.log('Nenhuma produção encontrada.');
        return 0;
      }

      // Filtrar por propriedade se necessário
      const producoesValidas = ids_bufalos ? producoes.filter((p: any) => ids_bufalos!.includes(p.id_bufala)) : producoes;

      // Agrupar por búfala
      const producoesPorBufala = this.agruparProducoesPorBufala(producoesValidas);

      let alertasCriados = 0;
      const hoje = new Date();

      for (const [id_bufala, listaProducoes] of Object.entries(producoesPorBufala)) {
        try {
          const analise = this.analisarQuedaProducao(listaProducoes as any[], hoje);

          if (analise.houveQueda && analise.percentualQueda >= AlertaConstants.QUEDA_PRODUCAO_PERCENTUAL_MINIMO) {
            const alertaCriado = await this.criarAlertaQuedaProducao(id_bufala, analise, hoje, id_propriedade);
            if (alertaCriado) alertasCriados++;
          }
        } catch (error) {
          this.logger.error(`Erro ao processar búfala ${id_bufala}:`, error);
        }
      }

      this.logger.log(`Verificação de queda de produção concluída: ${alertasCriados} alertas criados.`);
      return alertasCriados;
    } catch (error) {
      this.logger.error('Erro na verificação de queda de produção:', error);
      return 0;
    }
  }

  /**
   * Agrupa produções por búfala.
   */
  private agruparProducoesPorBufala(producoes: any[]): Record<string, any[]> {
    const agrupado: Record<string, any[]> = {};

    for (const prod of producoes) {
      if (!agrupado[prod.id_bufala]) {
        agrupado[prod.id_bufala] = [];
      }
      agrupado[prod.id_bufala].push(prod);
    }

    return agrupado;
  }

  /**
   * Analisa se houve queda de produção comparando períodos.
   */
  private analisarQuedaProducao(
    producoes: any[],
    hoje: Date,
  ): {
    houveQueda: boolean;
    percentualQueda: number;
    mediaRecente: number;
    mediaHistorica: number;
  } {
    const limite7dias = new Date(hoje);
    limite7dias.setDate(hoje.getDate() - AlertaConstants.DIAS_ANALISE_PRODUCAO_RECENTE);

    const limite37dias = new Date(hoje);
    limite37dias.setDate(hoje.getDate() - AlertaConstants.DIAS_ANALISE_PRODUCAO_RECENTE - AlertaConstants.DIAS_ANALISE_PRODUCAO_HISTORICO);

    // Separar produções em períodos
    const producoesRecentes = producoes.filter((p) => new Date(p.dt_ordenha) >= limite7dias);
    const producoesHistoricas = producoes.filter((p) => new Date(p.dt_ordenha) < limite7dias && new Date(p.dt_ordenha) >= limite37dias);

    // Verificar quantidade mínima de registros
    if (
      producoesRecentes.length < AlertaConstants.MIN_REGISTROS_PRODUCAO_7_DIAS ||
      producoesHistoricas.length < AlertaConstants.MIN_REGISTROS_PRODUCAO_30_DIAS
    ) {
      return {
        houveQueda: false,
        percentualQueda: 0,
        mediaRecente: 0,
        mediaHistorica: 0,
      };
    }

    // Calcular médias
    const mediaRecente = producoesRecentes.reduce((sum, p) => sum + parseFloat(p.quantidade), 0) / producoesRecentes.length;

    const mediaHistorica = producoesHistoricas.reduce((sum, p) => sum + parseFloat(p.quantidade), 0) / producoesHistoricas.length;

    // Calcular percentual de queda
    const percentualQueda = ((mediaHistorica - mediaRecente) / mediaHistorica) * 100;

    return {
      houveQueda: percentualQueda > 0,
      percentualQueda: Math.round(percentualQueda),
      mediaRecente: Math.round(mediaRecente * 100) / 100,
      mediaHistorica: Math.round(mediaHistorica * 100) / 100,
    };
  }

  /**
   * Cria alerta de queda de produção.
   */
  private async criarAlertaQuedaProducao(
    id_bufala: string,
    analise: { percentualQueda: number; mediaRecente: number; mediaHistorica: number },
    hoje: Date,
    id_propriedade?: string,
  ): Promise<boolean> {
    try {
      const { data: bufalaData, error } = await this.bufaloRepo.buscarBufaloSimples(id_bufala);
      if (error || !bufalaData) return false;

      let grupoNome = 'Não informado';
      if (bufalaData.id_grupo) {
        const { data: nomeGrupo } = await this.bufaloRepo.buscarNomeGrupo(bufalaData.id_grupo);
        if (nomeGrupo) grupoNome = nomeGrupo;
      }

      let propriedadeNome = 'Não informada';
      const propriedadeIdFinal = id_propriedade || bufalaData.id_propriedade;
      if (propriedadeIdFinal) {
        const { data: nomeProp } = await this.bufaloRepo.buscarNomePropriedade(propriedadeIdFinal);
        if (nomeProp) propriedadeNome = nomeProp;
      }

      // Prioridade baseada na gravidade da queda
      const prioridade = analise.percentualQueda >= AlertaConstants.QUEDA_PRODUCAO_CRITICA ? PrioridadeAlerta.ALTA : PrioridadeAlerta.MEDIA;

      const alertaDto: CreateAlertaDto = {
        animal_id: bufalaData.id_bufalo,
        grupo: grupoNome,
        localizacao: propriedadeNome,
        id_propriedade: propriedadeIdFinal,
        motivo: `Queda de ${analise.percentualQueda}% na produção de leite de ${bufalaData.nome}.`,
        nicho: NichoAlerta.PRODUCAO,
        data_alerta: hoje.toISOString().split('T')[0],
        prioridade: prioridade,
        observacao: `Média últimos 7 dias: ${analise.mediaRecente}L. Média 30 dias anteriores: ${analise.mediaHistorica}L. Investigar saúde, alimentação e condições de manejo.`,
        id_evento_origem: id_bufala,
        tipo_evento_origem: 'QUEDA_PRODUCAO',
      };

      await this.alertasService.createIfNotExists(alertaDto);
      return true;
    } catch (error) {
      this.logger.error('Erro ao criar alerta de queda de produção:', error);
      return false;
    }
  }
}
