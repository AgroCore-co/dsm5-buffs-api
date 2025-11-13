import { Injectable, Logger } from '@nestjs/common';
import { AlertasService } from '../alerta.service';
import { ReproducaoRepository } from '../repositories/reproducao.repository';
import { ProducaoRepository } from '../repositories/producao.repository';
import { BufaloRepository } from '../repositories/bufalo.repository';
import { CreateAlertaDto, NichoAlerta, PrioridadeAlerta } from '../dto/create-alerta.dto';
import { AlertaConstants, formatarDataBR } from '../utils/alerta.constants';

/**
 * Serviço de domínio para alertas de MANEJO.
 * Contém toda a lógica de negócio para verificação de:
 * - Secagem pendente (búfalas gestantes que ainda estão em ordenha)
 *
 * Responsabilidade: Lógica de negócio de alertas de manejo.
 */
@Injectable()
export class AlertaManejoService {
  private readonly logger = new Logger(AlertaManejoService.name);

  constructor(
    private readonly alertasService: AlertasService,
    private readonly reproducaoRepo: ReproducaoRepository,
    private readonly producaoRepo: ProducaoRepository,
    private readonly bufaloRepo: BufaloRepository,
  ) {}

  /**
   * Verifica búfalas gestantes que precisam ser secas (parar ordenha antes do parto).
   */
  async verificarSecagemPendente(id_propriedade?: string): Promise<number> {
    this.logger.log(`Verificando secagem pendente${id_propriedade ? ` para propriedade ${id_propriedade}` : ''}...`);

    try {
      const { data: reproducoes, error } = await this.reproducaoRepo.buscarGestacoesConfirmadas(id_propriedade);

      if (error || !reproducoes || reproducoes.length === 0) {
        this.logger.log('Nenhuma gestação confirmada encontrada.');
        return 0;
      }

      let alertasCriados = 0;
      const hoje = new Date();

      for (const rep of reproducoes) {
        try {
          if (!rep.dt_evento) continue;

          const dataEvento = new Date(rep.dt_evento);
          const dataPrevistaParto = new Date(dataEvento);
          dataPrevistaParto.setDate(dataEvento.getDate() + AlertaConstants.TEMPO_GESTACAO_DIAS);

          const diffTime = dataPrevistaParto.getTime() - hoje.getTime();
          const diasAteParto = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // Verifica se está dentro do período de secagem
          if (diasAteParto > 0 && diasAteParto <= AlertaConstants.DIAS_SECAGEM_ANTES_PARTO) {
            const aindaEmOrdenha = await this.verificarSeAindaEmOrdenha(rep.id_bufala);

            if (aindaEmOrdenha) {
              const alertaCriado = await this.criarAlertaSecagem(rep, dataPrevistaParto, diasAteParto);
              if (alertaCriado) alertasCriados++;
            }
          }
        } catch (error) {
          this.logger.error(`Erro ao processar reprodução ${rep.id_reproducao}:`, error);
        }
      }

      this.logger.log(`Verificação de secagem concluída: ${alertasCriados} alertas criados.`);
      return alertasCriados;
    } catch (error) {
      this.logger.error('Erro na verificação de secagem:', error);
      return 0;
    }
  }

  /**
   * Verifica se búfala ainda está em ordenha (tem registros recentes).
   */
  private async verificarSeAindaEmOrdenha(id_bufala: string): Promise<boolean> {
    const { data: ordenhas } = await this.producaoRepo.buscarOrdenhasRecentes(id_bufala, AlertaConstants.DIAS_VERIFICACAO_ORDENHA_SECAGEM);

    return !!(ordenhas && ordenhas.length > 0);
  } /**
   * Cria alerta de secagem pendente.
   */
  private async criarAlertaSecagem(reproducao: any, dataPrevistaParto: Date, diasAteParto: number): Promise<boolean> {
    try {
      const { data: bufalaData, error } = await this.bufaloRepo.buscarBufaloSimples(reproducao.id_bufala);
      if (error || !bufalaData) return false;

      let grupoNome = 'Não informado';
      if (bufalaData.id_grupo) {
        const { data: nomeGrupo } = await this.bufaloRepo.buscarNomeGrupo(bufalaData.id_grupo);
        if (nomeGrupo) grupoNome = nomeGrupo;
      }

      let propriedadeNome = 'Não informada';
      const propriedadeId = reproducao.id_propriedade || bufalaData.id_propriedade;
      if (propriedadeId) {
        const { data: nomeProp } = await this.bufaloRepo.buscarNomePropriedade(propriedadeId);
        if (nomeProp) propriedadeNome = nomeProp;
      }

      // Prioridade ALTA se está na janela final (últimos 45 dias)
      const prioridade = diasAteParto <= AlertaConstants.DIAS_SECAGEM_JANELA_FINAL ? PrioridadeAlerta.ALTA : PrioridadeAlerta.MEDIA;

      const alertaDto: CreateAlertaDto = {
        animal_id: bufalaData.id_bufalo,
        grupo: grupoNome,
        localizacao: propriedadeNome,
        id_propriedade: propriedadeId,
        motivo: `Búfala ${bufalaData.nome} gestante precisa ser seca. Parto previsto em ${diasAteParto} dias (${formatarDataBR(dataPrevistaParto)}).`,
        nicho: NichoAlerta.MANEJO,
        data_alerta: new Date().toISOString().split('T')[0],
        texto_ocorrencia_clinica: `Búfala ${bufalaData.nome} está gestante com parto previsto para ${formatarDataBR(dataPrevistaParto)} (daqui a ${diasAteParto} dias) mas continua em ordenha. Necessário realizar secagem para permitir recuperação da glândula mamária e preparação adequada para próxima lactação. Recomenda-se secar entre 45-60 dias antes do parto através da suspensão gradual da ordenha, evitando mastite e garantindo saúde da vaca e do bezerro.`,
        observacao: `Recomenda-se secar 60 dias antes do parto. Suspender ordenha gradualmente para preparação do animal.`,
        id_evento_origem: reproducao.id_reproducao,
        tipo_evento_origem: 'SECAGEM_PENDENTE',
      };

      await this.alertasService.createIfNotExists(alertaDto);
      return true;
    } catch (error) {
      this.logger.error('Erro ao criar alerta de secagem:', error);
      return false;
    }
  }
}
