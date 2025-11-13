import { Injectable, Logger } from '@nestjs/common';
import { AlertasService } from '../alerta.service';
import { SanitarioRepository } from '../repositories/sanitario.repository';
import { BufaloRepository } from '../repositories/bufalo.repository';
import { ProducaoRepository } from '../repositories/producao.repository';
import { CreateAlertaDto, NichoAlerta, PrioridadeAlerta } from '../dto/create-alerta.dto';
import { AlertaConstants, formatarDataBR } from '../utils/alerta.constants';

/**
 * Serviço de domínio para alertas SANITÁRIOS.
 * Contém toda a lógica de negócio para verificação de:
 * - Tratamentos com retorno programado
 * - Vacinações programadas
 *
 * Responsabilidade: Lógica de negócio de alertas sanitários.
 */
@Injectable()
export class AlertaSanitarioService {
  private readonly logger = new Logger(AlertaSanitarioService.name);

  constructor(
    private readonly alertasService: AlertasService,
    private readonly sanitarioRepo: SanitarioRepository,
    private readonly producaoRepo: ProducaoRepository,
    private readonly bufaloRepo: BufaloRepository,
  ) {}

  /**
   * Verifica tratamentos com retorno programado.
   */
  async verificarTratamentos(id_propriedade?: string): Promise<number> {
    this.logger.log(`Verificando tratamentos${id_propriedade ? ` para propriedade ${id_propriedade}` : ''}...`);

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

      const { data: tratamentos, error } = await this.sanitarioRepo.buscarTratamentosComRetorno(
        AlertaConstants.ANTECEDENCIA_SANITARIO_DIAS,
        ids_bufalos,
      );

      if (error || !tratamentos || tratamentos.length === 0) {
        this.logger.log('Nenhum tratamento com retorno encontrado.');
        return 0;
      }

      let alertasCriados = 0;

      for (const trat of tratamentos) {
        try {
          const alertaCriado = await this.criarAlertaTratamento(trat, new Date(trat.dt_retorno));
          if (alertaCriado) alertasCriados++;
        } catch (error) {
          this.logger.error(`Erro ao processar tratamento ${trat.id_sanit}:`, error);
        }
      }

      this.logger.log(`Verificação de tratamentos concluída: ${alertasCriados} alertas criados.`);
      return alertasCriados;
    } catch (error) {
      this.logger.error('Erro na verificação de tratamentos:', error);
      return 0;
    }
  }

  /**
   * Cria alerta de tratamento com retorno.
   */
  private async criarAlertaTratamento(tratamento: any, dtRetorno: Date): Promise<boolean> {
    try {
      const { data: bufaloData, error } = await this.bufaloRepo.buscarBufaloSimples(tratamento.id_bufalo);
      if (error || !bufaloData) return false;

      let grupoNome = 'Não informado';
      if (bufaloData.id_grupo) {
        const { data: nomeGrupo } = await this.bufaloRepo.buscarNomeGrupo(bufaloData.id_grupo);
        if (nomeGrupo) grupoNome = nomeGrupo;
      }

      let propriedadeNome = 'Não informada';
      const propriedadeId = tratamento.id_propriedade || bufaloData.id_propriedade;
      if (propriedadeId) {
        const { data: nomeProp } = await this.bufaloRepo.buscarNomePropriedade(propriedadeId);
        if (nomeProp) propriedadeNome = nomeProp;
      }

      const alertaDto: CreateAlertaDto = {
        animal_id: bufaloData.id_bufalo,
        grupo: grupoNome,
        localizacao: propriedadeNome,
        id_propriedade: propriedadeId,
        motivo: `Retorno agendado para ${formatarDataBR(dtRetorno)} - ${tratamento.tipo_intervencao || 'Intervenção'}.`,
        nicho: NichoAlerta.SANITARIO,
        data_alerta: dtRetorno.toISOString().split('T')[0],
        texto_ocorrencia_clinica: `Búfalo ${bufaloData.nome} possui retorno agendado para ${formatarDataBR(dtRetorno)} referente a tratamento de ${tratamento.diagnostico || 'condição não especificada'}. Tipo de intervenção: ${tratamento.tipo_intervencao || 'Não informado'}. Necessário separar animal para reavaliação veterinária e verificar evolução do quadro clínico.`,
        observacao: `Tratamento: ${tratamento.diagnostico || 'Não informado'}. Separar animal para reavaliação veterinária.`,
        id_evento_origem: tratamento.id_dados_sanitarios,
        tipo_evento_origem: 'DADOS_SANITARIOS',
      };

      await this.alertasService.createIfNotExists(alertaDto);
      return true;
    } catch (error) {
      this.logger.error('Erro ao criar alerta de tratamento:', error);
      return false;
    }
  }

  /**
   * Verifica vacinações programadas.
   */
  async verificarVacinacoes(id_propriedade?: string): Promise<number> {
    this.logger.log(`Verificando vacinações${id_propriedade ? ` para propriedade ${id_propriedade}` : ''}...`);

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

      const { data: vacinacoes, error } = await this.producaoRepo.buscarVacinacoesprogramadas(
        AlertaConstants.ANTECEDENCIA_VACINACAO_DIAS,
        ids_bufalos,
      );

      if (error || !vacinacoes || vacinacoes.length === 0) {
        this.logger.log('Nenhuma vacinação programada encontrada.');
        return 0;
      }

      let alertasCriados = 0;

      for (const vac of vacinacoes) {
        try {
          const alertaCriado = await this.criarAlertaVacinacao(vac, new Date(vac.dt_aplicacao));
          if (alertaCriado) alertasCriados++;
        } catch (error) {
          this.logger.error(`Erro ao processar vacinação ${vac.id_vacinacao}:`, error);
        }
      }

      this.logger.log(`Verificação de vacinações concluída: ${alertasCriados} alertas criados.`);
      return alertasCriados;
    } catch (error) {
      this.logger.error('Erro na verificação de vacinações:', error);
      return 0;
    }
  }

  /**
   * Cria alerta de vacinação programada.
   */
  private async criarAlertaVacinacao(vacinacao: any, dtProxVac: Date): Promise<boolean> {
    try {
      const { data: bufaloData, error } = await this.bufaloRepo.buscarBufaloSimples(vacinacao.id_bufalo);
      if (error || !bufaloData) return false;

      let grupoNome = 'Não informado';
      if (bufaloData.id_grupo) {
        const { data: nomeGrupo } = await this.bufaloRepo.buscarNomeGrupo(bufaloData.id_grupo);
        if (nomeGrupo) grupoNome = nomeGrupo;
      }

      let propriedadeNome = 'Não informada';
      const propriedadeId = vacinacao.id_propriedade || bufaloData.id_propriedade;
      if (propriedadeId) {
        const { data: nomeProp } = await this.bufaloRepo.buscarNomePropriedade(propriedadeId);
        if (nomeProp) propriedadeNome = nomeProp;
      }

      const alertaDto: CreateAlertaDto = {
        animal_id: bufaloData.id_bufalo,
        grupo: grupoNome,
        localizacao: propriedadeNome,
        id_propriedade: propriedadeId,
        motivo: `Vacinação de ${bufaloData.nome} programada para ${formatarDataBR(dtProxVac)}.`,
        nicho: NichoAlerta.SANITARIO,
        data_alerta: dtProxVac.toISOString().split('T')[0],
        texto_ocorrencia_clinica: `Vacinação programada para búfalo ${bufaloData.nome} em ${formatarDataBR(dtProxVac)}. Vacina: ${vacinacao.tipo_vacina || 'Não informado'}. Necessário preparar seringas, verificar estoque do imunobiológico e condições de armazenamento. Protocolo de vacinação conforme calendário sanitário do rebanho.`,
        observacao: `Vacina: ${vacinacao.tipo_vacina || 'Não informado'}. Preparar seringas e verificar estoque do imunobiológico.`,
        id_evento_origem: vacinacao.id_vacinacao,
        tipo_evento_origem: 'VACINACAO',
      };

      await this.alertasService.createIfNotExists(alertaDto);
      return true;
    } catch (error) {
      this.logger.error('Erro ao criar alerta de vacinação:', error);
      return false;
    }
  }
}
