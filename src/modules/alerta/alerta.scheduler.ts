import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from 'src/core/supabase/supabase.service';
import { CreateAlertaDto, NichoAlerta, PrioridadeAlerta } from './dto/create-alerta.dto';
import { AlertasService } from './alerta.service';

// Constantes para configuração
const TEMPO_GESTAÇÃO_DIAS = 315;
const ANTECEDENCIA_PARTO_DIAS = 30; // Alerta será gerado 30 dias antes
const ANTECEDENCIA_SANITARIO_DIAS = 15; // Alerta será gerado 15 dias antes
const ANTECEDENCIA_VACINACAO_DIAS = 30; // Alerta será gerado 30 dias antes

/**
 * Função auxiliar para formatar datas no padrão brasileiro.
 * @param date - Data a ser formatada (string ISO ou objeto Date)
 * @returns String formatada no padrão dd/MM/yyyy
 */
function formatarDataBR(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

@Injectable()
export class AlertasScheduler {
  private readonly logger = new Logger(AlertasScheduler.name);
  private supabase: SupabaseClient;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly alertasService: AlertasService,
  ) {
    this.supabase = this.supabaseService.getAdminClient();
  }

  /**
   * Executa todo dia à meia-noite para verificar tratamentos sanitários agendados.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async verificarTratamentos() {
    this.logger.log('Iniciando verificação de tratamentos sanitários agendados...');

    try {
      const hoje = new Date();
      const dataInicio = hoje.toISOString().split('T')[0];

      const dataFim = new Date();
      dataFim.setDate(hoje.getDate() + 30); // Próximos 30 dias
      const dataFimString = dataFim.toISOString().split('T')[0];

      // Busca tratamentos que precisam de retorno nos próximos 30 dias
      const { data: tratamentos, error } = await this.supabase
        .from('dadossanitarios')
        .select('id_sanit, dt_retorno, doenca, id_bufalo')
        .eq('necessita_retorno', true)
        .gte('dt_retorno', dataInicio)
        .lte('dt_retorno', dataFimString);

      if (error) {
        this.logger.error('Erro ao buscar tratamentos sanitários:', error.message);
        return;
      }

      if (!tratamentos || tratamentos.length === 0) {
        this.logger.log('Nenhum tratamento sanitário encontrado para a data alvo.');
        return;
      }

      let alertasCriados = 0;
      let alertasComErro = 0;

      for (const tratamento of tratamentos) {
        try {
          if (!tratamento.id_bufalo) {
            this.logger.warn(`ID do búfalo não encontrado para tratamento ${tratamento.id_sanit}`);
            alertasComErro++;
            continue;
          }

          // Buscar informações do búfalo
          const { data: bufaloData } = await this.supabase
            .from('bufalo')
            .select('id_bufalo, id_grupo, id_propriedade')
            .eq('id_bufalo', tratamento.id_bufalo)
            .single();

          if (!bufaloData) {
            this.logger.warn(`Búfalo não encontrado para tratamento ${tratamento.id_sanit}`);
            alertasComErro++;
            continue;
          }

          // Buscar nome do grupo se existir
          let grupoNome = 'Não informado';
          if (bufaloData.id_grupo) {
            const { data: grupoData } = await this.supabase.from('grupo').select('nome_grupo').eq('id_grupo', bufaloData.id_grupo).single();

            if (grupoData) {
              grupoNome = grupoData.nome_grupo;
            }
          }

          // Buscar nome da propriedade
          let propriedadeNome = 'Não informada';
          if (bufaloData.id_propriedade) {
            const { data: propData } = await this.supabase
              .from('propriedade')
              .select('nome')
              .eq('id_propriedade', bufaloData.id_propriedade)
              .single();

            if (propData) {
              propriedadeNome = propData.nome;
            }
          }

          const alertaDto: CreateAlertaDto = {
            animal_id: bufaloData.id_bufalo,
            grupo: grupoNome,
            localizacao: propriedadeNome,
            id_propriedade: bufaloData.id_propriedade,
            motivo: `Retorno de tratamento para "${tratamento.doenca}" agendado.`,
            nicho: NichoAlerta.SANITARIO,
            data_alerta: tratamento.dt_retorno,
            prioridade: PrioridadeAlerta.MEDIA,
            observacao: `Verificar protocolo sanitário. ID do tratamento original: ${tratamento.id_sanit}`,
            id_evento_origem: tratamento.id_sanit,
            tipo_evento_origem: 'DADOS_SANITARIOS',
          };

          await this.alertasService.createIfNotExists(alertaDto);
          alertasCriados++;
        } catch (alertaError) {
          this.logger.error(`Erro ao criar alerta para tratamento ${tratamento.id_sanit}:`, alertaError);
          alertasComErro++;
        }
      }

      this.logger.log(`Verificação de tratamentos concluída. ${alertasCriados} alertas criados, ${alertasComErro} erros.`);
    } catch (error) {
      this.logger.error('Erro geral na verificação de tratamentos sanitários:', error);
    }
  }

  /**
   * Executa todo dia às 00:05 para verificar previsões de nascimento.
   */
  @Cron('5 0 * * *') // 00:05 todos os dias
  async verificarNascimentos() {
    this.logger.log('Iniciando verificação de previsões de nascimento...');

    try {
      const { data: reproducoes, error } = await this.supabase
        .from('dadosreproducao')
        .select('id_reproducao, dt_evento, id_bufala, id_propriedade')
        .eq('status', 'Confirmada'); // Apenas para gestações confirmadas

      if (error) {
        this.logger.error('Erro ao buscar dados de reprodução:', error.message);
        return;
      }

      if (!reproducoes || reproducoes.length === 0) {
        this.logger.log('Nenhum dado de reprodução encontrado para processar.');
        return;
      }

      let alertasCriados = 0;
      let alertasComErro = 0;

      for (const rep of reproducoes) {
        try {
          if (!rep.dt_evento) {
            this.logger.warn(`Data do evento não encontrada para reprodução ${rep.id_reproducao}`);
            alertasComErro++;
            continue;
          }

          const dataEvento = new Date(rep.dt_evento);
          const dataPrevistaParto = new Date(dataEvento);
          dataPrevistaParto.setDate(dataEvento.getDate() + TEMPO_GESTAÇÃO_DIAS);

          const hoje = new Date();
          const diffTime = dataPrevistaParto.getTime() - hoje.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // Gera o alerta apenas quando a data estiver no intervalo de antecedência
          if (diffDays > 0 && diffDays <= ANTECEDENCIA_PARTO_DIAS) {
            if (!rep.id_bufala) {
              this.logger.warn(`ID da búfala não encontrado para reprodução ${rep.id_reproducao}`);
              alertasComErro++;
              continue;
            }

            // Buscar informações da búfala
            const { data: bufalaData } = await this.supabase
              .from('bufalo')
              .select('id_bufalo, id_grupo, id_propriedade')
              .eq('id_bufalo', rep.id_bufala)
              .single();

            if (!bufalaData) {
              this.logger.warn(`Búfala não encontrada para reprodução ${rep.id_reproducao}`);
              alertasComErro++;
              continue;
            }

            // Buscar nome do grupo se existir
            let grupoNome = 'Não informado';
            if (bufalaData.id_grupo) {
              const { data: grupoData } = await this.supabase.from('grupo').select('nome_grupo').eq('id_grupo', bufalaData.id_grupo).single();

              if (grupoData) {
                grupoNome = grupoData.nome_grupo;
              }
            }

            // Buscar nome da propriedade
            let propriedadeNome = 'Não informada';
            const propriedadeId = rep.id_propriedade || bufalaData.id_propriedade;
            if (propriedadeId) {
              const { data: propData } = await this.supabase.from('propriedade').select('nome').eq('id_propriedade', propriedadeId).single();

              if (propData) {
                propriedadeNome = propData.nome;
              }
            }

            const alertaDto: CreateAlertaDto = {
              animal_id: bufalaData.id_bufalo,
              grupo: grupoNome,
              localizacao: propriedadeNome,
              id_propriedade: propriedadeId,
              motivo: `Previsão de parto para ${dataPrevistaParto.toLocaleDateString('pt-BR')}.`,
              nicho: NichoAlerta.REPRODUCAO,
              data_alerta: dataPrevistaParto.toISOString().split('T')[0],
              prioridade: PrioridadeAlerta.ALTA,
              observacao: `Preparar área de maternidade. Gestação confirmada em ${formatarDataBR(rep.dt_evento)}.`,
              id_evento_origem: rep.id_reproducao,
              tipo_evento_origem: 'DADOS_REPRODUCAO',
            };

            await this.alertasService.createIfNotExists(alertaDto);
            alertasCriados++;
          }
        } catch (repError) {
          this.logger.error(`Erro ao processar reprodução ${rep.id_reproducao}:`, repError);
          alertasComErro++;
        }
      }

      this.logger.log(`Verificação de nascimentos concluída. ${alertasCriados} alertas criados, ${alertasComErro} erros.`);
    } catch (error) {
      this.logger.error('Erro geral na verificação de nascimentos:', error);
    }
  }

  /**
   * Executa todo dia às 01:00 para verificar coberturas sem diagnóstico.
   * Alerta para coberturas "Em andamento" há mais de 90 dias.
   */
  @Cron('0 1 * * *') // 01:00 todos os dias
  async verificarCoberturaSemDiagnostico() {
    this.logger.log('Iniciando verificação de coberturas sem diagnóstico...');

    try {
      const { data: coberturas, error } = await this.supabase
        .from('dadosreproducao')
        .select('id_reproducao, dt_evento, id_bufala, id_propriedade, tipo_inseminacao')
        .eq('status', 'Em andamento');

      if (error) {
        this.logger.error('Erro ao buscar coberturas:', error.message);
        return;
      }

      if (!coberturas || coberturas.length === 0) {
        this.logger.log('Nenhuma cobertura em andamento encontrada.');
        return;
      }

      let alertasCriados = 0;
      let alertasComErro = 0;
      const hoje = new Date();

      for (const cob of coberturas) {
        try {
          if (!cob.dt_evento) continue;

          const dtCobertura = new Date(cob.dt_evento);
          const diasDesdeCobertura = Math.floor((hoje.getTime() - dtCobertura.getTime()) / (1000 * 60 * 60 * 24));

          // Alerta se passaram mais de 90 dias sem diagnóstico
          if (diasDesdeCobertura >= 90) {
            const { data: bufalaData } = await this.supabase
              .from('bufalo')
              .select('id_bufalo, nome, id_grupo, id_propriedade')
              .eq('id_bufalo', cob.id_bufala)
              .single();

            if (!bufalaData) continue;

            let grupoNome = 'Não informado';
            if (bufalaData.id_grupo) {
              const { data: grupoData } = await this.supabase.from('grupo').select('nome_grupo').eq('id_grupo', bufalaData.id_grupo).single();
              if (grupoData) grupoNome = grupoData.nome_grupo;
            }

            let propriedadeNome = 'Não informada';
            const propriedadeId = cob.id_propriedade || bufalaData.id_propriedade;
            if (propriedadeId) {
              const { data: propData } = await this.supabase.from('propriedade').select('nome').eq('id_propriedade', propriedadeId).single();
              if (propData) propriedadeNome = propData.nome;
            }

            await this.alertasService.createIfNotExists({
              animal_id: bufalaData.id_bufalo,
              grupo: grupoNome,
              localizacao: propriedadeNome,
              id_propriedade: propriedadeId,
              motivo: `Búfala ${bufalaData.nome} com cobertura há ${diasDesdeCobertura} dias sem diagnóstico de prenhez.`,
              nicho: NichoAlerta.REPRODUCAO,
              data_alerta: hoje.toISOString().split('T')[0],
              prioridade: PrioridadeAlerta.MEDIA,
              observacao: `Cobertura realizada em ${formatarDataBR(cob.dt_evento)} (${cob.tipo_inseminacao}). Realizar ultrassonografia.`,
              id_evento_origem: cob.id_reproducao,
              tipo_evento_origem: 'COBERTURA_SEM_DIAGNOSTICO',
            });

            alertasCriados++;
          }
        } catch (cobError) {
          this.logger.error(`Erro ao processar cobertura ${cob.id_reproducao}:`, cobError);
          alertasComErro++;
        }
      }

      this.logger.log(`Verificação de coberturas sem diagnóstico concluída. ${alertasCriados} alertas criados, ${alertasComErro} erros.`);
    } catch (error) {
      this.logger.error('Erro geral na verificação de coberturas sem diagnóstico:', error);
    }
  }

  /**
   * Executa todo dia às 02:00 para verificar fêmeas vazias há muito tempo.
   * Alerta para fêmeas aptas sem cobertura há mais de 180 dias.
   */
  @Cron('0 2 * * *') // 02:00 todos os dias
  async verificarFemeasVazias() {
    this.logger.log('Iniciando verificação de fêmeas vazias prolongadas...');

    try {
      // Buscar todas as fêmeas ativas com idade reprodutiva (18+ meses)
      const idadeMinimaReproducao = new Date();
      idadeMinimaReproducao.setMonth(idadeMinimaReproducao.getMonth() - 18);

      const { data: femeas, error } = await this.supabase
        .from('bufalo')
        .select('id_bufalo, nome, dt_nascimento, id_grupo, id_propriedade')
        .eq('sexo', 'F')
        .eq('status', true)
        .lte('dt_nascimento', idadeMinimaReproducao.toISOString());

      if (error || !femeas) {
        this.logger.error('Erro ao buscar fêmeas:', error?.message);
        return;
      }

      let alertasCriados = 0;
      let alertasComErro = 0;
      const hoje = new Date();

      for (const femea of femeas) {
        try {
          // Buscar última cobertura
          const { data: ultimaCobertura } = await this.supabase
            .from('dadosreproducao')
            .select('dt_evento, status')
            .eq('id_bufala', femea.id_bufalo)
            .order('dt_evento', { ascending: false })
            .limit(1)
            .single();

          let diasSemCobertura = 0;

          if (!ultimaCobertura) {
            // Nunca foi coberta - usar idade como referência
            const idadeMeses = Math.floor((hoje.getTime() - new Date(femea.dt_nascimento).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
            if (idadeMeses < 24) continue; // Só alerta se tem 24+ meses e nunca foi coberta
            diasSemCobertura = 999; // Valor simbólico para "nunca coberta"
          } else if (ultimaCobertura.status === 'Falhou' || ultimaCobertura.status === 'Concluída') {
            diasSemCobertura = Math.floor((hoje.getTime() - new Date(ultimaCobertura.dt_evento).getTime()) / (1000 * 60 * 60 * 24));
          } else {
            continue; // Tem cobertura ativa, pula
          }

          // Alerta se sem cobertura há 180+ dias
          if (diasSemCobertura >= 180) {
            let grupoNome = 'Não informado';
            if (femea.id_grupo) {
              const { data: grupoData } = await this.supabase.from('grupo').select('nome_grupo').eq('id_grupo', femea.id_grupo).single();
              if (grupoData) grupoNome = grupoData.nome_grupo;
            }

            let propriedadeNome = 'Não informada';
            if (femea.id_propriedade) {
              const { data: propData } = await this.supabase.from('propriedade').select('nome').eq('id_propriedade', femea.id_propriedade).single();
              if (propData) propriedadeNome = propData.nome;
            }

            const motivoTexto =
              diasSemCobertura === 999
                ? `Fêmea ${femea.nome} apta para reprodução mas nunca foi coberta.`
                : `Fêmea ${femea.nome} sem cobertura há ${diasSemCobertura} dias.`;

            await this.alertasService.createIfNotExists({
              animal_id: femea.id_bufalo,
              grupo: grupoNome,
              localizacao: propriedadeNome,
              id_propriedade: femea.id_propriedade,
              motivo: motivoTexto,
              nicho: NichoAlerta.REPRODUCAO,
              data_alerta: hoje.toISOString().split('T')[0],
              prioridade: PrioridadeAlerta.BAIXA,
              observacao: 'Avaliar aptidão reprodutiva e planejar cobertura/inseminação.',
              id_evento_origem: femea.id_bufalo,
              tipo_evento_origem: 'FEMEA_VAZIA',
            });

            alertasCriados++;
          }
        } catch (femeaError) {
          this.logger.error(`Erro ao processar fêmea ${femea.id_bufalo}:`, femeaError);
          alertasComErro++;
        }
      }

      this.logger.log(`Verificação de fêmeas vazias concluída. ${alertasCriados} alertas criados, ${alertasComErro} erros.`);
    } catch (error) {
      this.logger.error('Erro geral na verificação de fêmeas vazias:', error);
    }
  }

  /**
   * Executa todo dia às 03:00 para verificar vacinações e vermifugações programadas.
   */
  @Cron('0 3 * * *') // 03:00 todos os dias
  async verificarVacinacoes() {
    this.logger.log('Iniciando verificação de vacinações programadas...');

    try {
      const hoje = new Date();
      const dataLimite = new Date();
      dataLimite.setDate(hoje.getDate() + ANTECEDENCIA_VACINACAO_DIAS);

      const hojeStr = hoje.toISOString().split('T')[0];
      const dataLimiteStr = dataLimite.toISOString().split('T')[0];

      const { data: vacinacoes, error } = await this.supabase
        .from('vacinacao')
        .select('id_vacinacao, dt_aplicacao, tipo_vacina, id_bufalo, id_propriedade')
        .gte('dt_aplicacao', hojeStr)
        .lte('dt_aplicacao', dataLimiteStr);

      if (error || !vacinacoes || vacinacoes.length === 0) {
        this.logger.log('Nenhuma vacinação programada para os próximos 30 dias.');
        return;
      }

      let alertasCriados = 0;
      let alertasComErro = 0;

      for (const vac of vacinacoes) {
        try {
          const { data: bufaloData } = await this.supabase
            .from('bufalo')
            .select('id_bufalo, nome, id_grupo, id_propriedade')
            .eq('id_bufalo', vac.id_bufalo)
            .single();

          if (!bufaloData) continue;

          let grupoNome = 'Não informado';
          if (bufaloData.id_grupo) {
            const { data: grupoData } = await this.supabase.from('grupo').select('nome_grupo').eq('id_grupo', bufaloData.id_grupo).single();
            if (grupoData) grupoNome = grupoData.nome_grupo;
          }

          let propriedadeNome = 'Não informada';
          const propriedadeId = vac.id_propriedade || bufaloData.id_propriedade;
          if (propriedadeId) {
            const { data: propData } = await this.supabase.from('propriedade').select('nome').eq('id_propriedade', propriedadeId).single();
            if (propData) propriedadeNome = propData.nome;
          }

          await this.alertasService.createIfNotExists({
            animal_id: bufaloData.id_bufalo,
            grupo: grupoNome,
            localizacao: propriedadeNome,
            id_propriedade: propriedadeId,
            motivo: `Vacinação programada: ${vac.tipo_vacina} para ${bufaloData.nome}.`,
            nicho: NichoAlerta.SANITARIO,
            data_alerta: vac.dt_aplicacao,
            prioridade: PrioridadeAlerta.MEDIA,
            observacao: `Preparar vacina e equipamentos. Data: ${formatarDataBR(vac.dt_aplicacao)}.`,
            id_evento_origem: vac.id_vacinacao,
            tipo_evento_origem: 'VACINACAO_PROGRAMADA',
          });

          alertasCriados++;
        } catch (vacError) {
          this.logger.error(`Erro ao processar vacinação ${vac.id_vacinacao}:`, vacError);
          alertasComErro++;
        }
      }

      this.logger.log(`Verificação de vacinações concluída. ${alertasCriados} alertas criados, ${alertasComErro} erros.`);
    } catch (error) {
      this.logger.error('Erro geral na verificação de vacinações:', error);
    }
  }

  /**
   * Métodos públicos para verificação manual por propriedade
   * Usados pelo endpoint de verificação manual de alertas
   */

  /**
   * Verifica tratamentos sanitários para uma propriedade específica.
   * @param id_propriedade - ID da propriedade
   * @returns Número de alertas criados
   */
  async verificarTratamentosPropriedade(id_propriedade: string): Promise<number> {
    this.logger.log(`Verificando tratamentos para propriedade ${id_propriedade}...`);

    try {
      const hoje = new Date();
      const dataInicio = hoje.toISOString().split('T')[0];

      const dataFim = new Date();
      dataFim.setDate(hoje.getDate() + 30); // Próximos 30 dias
      const dataFimString = dataFim.toISOString().split('T')[0];

      // Busca búfalos da propriedade
      const { data: bufalos, error: bufaloError } = await this.supabase.from('bufalo').select('id_bufalo').eq('id_propriedade', id_propriedade);

      if (bufaloError || !bufalos || bufalos.length === 0) {
        this.logger.log('Nenhum búfalo encontrado para a propriedade.');
        return 0;
      }

      const bufaloIds = bufalos.map((b) => b.id_bufalo);

      // Busca tratamentos dos búfalos da propriedade nos próximos 30 dias
      const { data: tratamentos, error } = await this.supabase
        .from('dadossanitarios')
        .select('id_sanit, dt_retorno, doenca, id_bufalo')
        .eq('necessita_retorno', true)
        .gte('dt_retorno', dataInicio)
        .lte('dt_retorno', dataFimString)
        .in('id_bufalo', bufaloIds);

      this.logger.log(`Buscando tratamentos entre ${dataInicio} e ${dataFimString}`);
      this.logger.log(`Encontrados ${tratamentos?.length || 0} tratamentos para verificar`);

      if (error || !tratamentos) {
        this.logger.error('Erro ao buscar tratamentos:', error?.message);
        return 0;
      }

      if (tratamentos.length === 0) {
        this.logger.log('Nenhum tratamento encontrado para a propriedade nos próximos 30 dias.');
        return 0;
      }

      let alertasCriados = 0;

      for (const tratamento of tratamentos) {
        try {
          if (!tratamento.id_bufalo) continue;

          const { data: bufaloData } = await this.supabase
            .from('bufalo')
            .select('id_bufalo, id_grupo, id_propriedade')
            .eq('id_bufalo', tratamento.id_bufalo)
            .single();

          if (!bufaloData) continue;

          let grupoNome = 'Não informado';
          if (bufaloData.id_grupo) {
            const { data: grupoData } = await this.supabase.from('grupo').select('nome_grupo').eq('id_grupo', bufaloData.id_grupo).single();
            if (grupoData) grupoNome = grupoData.nome_grupo;
          }

          let propriedadeNome = 'Não informada';
          if (id_propriedade) {
            const { data: propData } = await this.supabase.from('propriedade').select('nome').eq('id_propriedade', id_propriedade).single();
            if (propData) propriedadeNome = propData.nome;
          }

          const alertaDto: CreateAlertaDto = {
            animal_id: bufaloData.id_bufalo,
            grupo: grupoNome,
            localizacao: propriedadeNome,
            id_propriedade: id_propriedade,
            motivo: `Retorno de tratamento para "${tratamento.doenca}" agendado.`,
            nicho: NichoAlerta.SANITARIO,
            data_alerta: tratamento.dt_retorno,
            prioridade: PrioridadeAlerta.MEDIA,
            observacao: `Verificar protocolo sanitário. ID do tratamento original: ${tratamento.id_sanit}`,
            id_evento_origem: tratamento.id_sanit,
            tipo_evento_origem: 'DADOS_SANITARIOS',
          };

          await this.alertasService.createIfNotExists(alertaDto);
          alertasCriados++;
        } catch (error) {
          this.logger.error(`Erro ao criar alerta para tratamento ${tratamento.id_sanit}:`, error);
        }
      }

      this.logger.log(`Verificação de tratamentos concluída para propriedade ${id_propriedade}: ${alertasCriados} alertas criados.`);
      return alertasCriados;
    } catch (error) {
      this.logger.error(`Erro na verificação de tratamentos para propriedade ${id_propriedade}:`, error);
      return 0;
    }
  }

  /**
   * Verifica nascimentos previstos para uma propriedade específica.
   * @param id_propriedade - ID da propriedade
   * @returns Número de alertas criados
   */
  async verificarNascimentosPropriedade(id_propriedade: string): Promise<number> {
    this.logger.log(`Verificando nascimentos para propriedade ${id_propriedade}...`);

    try {
      const { data: reproducoes, error } = await this.supabase
        .from('dadosreproducao')
        .select('id_reproducao, dt_evento, id_bufala, id_propriedade')
        .eq('status', 'Confirmada')
        .eq('id_propriedade', id_propriedade);

      if (error || !reproducoes) {
        this.logger.error('Erro ao buscar reproduções:', error?.message);
        return 0;
      }

      let alertasCriados = 0;
      const hoje = new Date();

      for (const rep of reproducoes) {
        try {
          if (!rep.dt_evento) continue;

          const dataEvento = new Date(rep.dt_evento);
          const dataPrevistaParto = new Date(dataEvento);
          dataPrevistaParto.setDate(dataEvento.getDate() + TEMPO_GESTAÇÃO_DIAS);

          const diffTime = dataPrevistaParto.getTime() - hoje.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays > 0 && diffDays <= ANTECEDENCIA_PARTO_DIAS) {
            if (!rep.id_bufala) continue;

            const { data: bufalaData } = await this.supabase
              .from('bufalo')
              .select('id_bufalo, id_grupo, id_propriedade')
              .eq('id_bufalo', rep.id_bufala)
              .single();

            if (!bufalaData) continue;

            let grupoNome = 'Não informado';
            if (bufalaData.id_grupo) {
              const { data: grupoData } = await this.supabase.from('grupo').select('nome_grupo').eq('id_grupo', bufalaData.id_grupo).single();
              if (grupoData) grupoNome = grupoData.nome_grupo;
            }

            let propriedadeNome = 'Não informada';
            if (id_propriedade) {
              const { data: propData } = await this.supabase.from('propriedade').select('nome').eq('id_propriedade', id_propriedade).single();
              if (propData) propriedadeNome = propData.nome;
            }

            const alertaDto: CreateAlertaDto = {
              animal_id: bufalaData.id_bufalo,
              grupo: grupoNome,
              localizacao: propriedadeNome,
              id_propriedade: id_propriedade,
              motivo: `Previsão de parto para ${dataPrevistaParto.toLocaleDateString('pt-BR')}.`,
              nicho: NichoAlerta.REPRODUCAO,
              data_alerta: dataPrevistaParto.toISOString().split('T')[0],
              prioridade: PrioridadeAlerta.ALTA,
              observacao: `Preparar área de maternidade. Gestação confirmada em ${formatarDataBR(rep.dt_evento)}.`,
              id_evento_origem: rep.id_reproducao,
              tipo_evento_origem: 'DADOS_REPRODUCAO',
            };

            await this.alertasService.createIfNotExists(alertaDto);
            alertasCriados++;
          }
        } catch (error) {
          this.logger.error(`Erro ao processar reprodução ${rep.id_reproducao}:`, error);
        }
      }

      this.logger.log(`Verificação de nascimentos concluída para propriedade ${id_propriedade}: ${alertasCriados} alertas criados.`);
      return alertasCriados;
    } catch (error) {
      this.logger.error(`Erro na verificação de nascimentos para propriedade ${id_propriedade}:`, error);
      return 0;
    }
  }

  /**
   * Verifica coberturas sem diagnóstico para uma propriedade específica.
   * @param id_propriedade - ID da propriedade
   * @returns Número de alertas criados
   */
  async verificarCoberturaSemDiagnosticoPropriedade(id_propriedade: string): Promise<number> {
    this.logger.log(`Verificando coberturas sem diagnóstico para propriedade ${id_propriedade}...`);

    try {
      const { data: coberturas, error } = await this.supabase
        .from('dadosreproducao')
        .select('id_reproducao, dt_evento, id_bufala, id_propriedade, tipo_inseminacao')
        .eq('status', 'Em andamento')
        .eq('id_propriedade', id_propriedade);

      if (error || !coberturas) {
        this.logger.error('Erro ao buscar coberturas:', error?.message);
        return 0;
      }

      let alertasCriados = 0;
      const hoje = new Date();

      for (const cob of coberturas) {
        try {
          if (!cob.dt_evento) continue;

          const dtCobertura = new Date(cob.dt_evento);
          const diasDesdeCobertura = Math.floor((hoje.getTime() - dtCobertura.getTime()) / (1000 * 60 * 60 * 24));

          if (diasDesdeCobertura >= 90) {
            const { data: bufalaData } = await this.supabase
              .from('bufalo')
              .select('id_bufalo, nome, id_grupo, id_propriedade')
              .eq('id_bufalo', cob.id_bufala)
              .single();

            if (!bufalaData) continue;

            let grupoNome = 'Não informado';
            if (bufalaData.id_grupo) {
              const { data: grupoData } = await this.supabase.from('grupo').select('nome_grupo').eq('id_grupo', bufalaData.id_grupo).single();
              if (grupoData) grupoNome = grupoData.nome_grupo;
            }

            let propriedadeNome = 'Não informada';
            if (id_propriedade) {
              const { data: propData } = await this.supabase.from('propriedade').select('nome').eq('id_propriedade', id_propriedade).single();
              if (propData) propriedadeNome = propData.nome;
            }

            await this.alertasService.createIfNotExists({
              animal_id: bufalaData.id_bufalo,
              grupo: grupoNome,
              localizacao: propriedadeNome,
              id_propriedade: id_propriedade,
              motivo: `Búfala ${bufalaData.nome} com cobertura há ${diasDesdeCobertura} dias sem diagnóstico de prenhez.`,
              nicho: NichoAlerta.REPRODUCAO,
              data_alerta: hoje.toISOString().split('T')[0],
              prioridade: PrioridadeAlerta.MEDIA,
              observacao: `Cobertura realizada em ${formatarDataBR(cob.dt_evento)} (${cob.tipo_inseminacao}). Realizar ultrassonografia.`,
              id_evento_origem: cob.id_reproducao,
              tipo_evento_origem: 'COBERTURA_SEM_DIAGNOSTICO',
            });

            alertasCriados++;
          }
        } catch (error) {
          this.logger.error(`Erro ao processar cobertura ${cob.id_reproducao}:`, error);
        }
      }

      this.logger.log(`Verificação de coberturas sem diagnóstico concluída para propriedade ${id_propriedade}: ${alertasCriados} alertas criados.`);
      return alertasCriados;
    } catch (error) {
      this.logger.error(`Erro na verificação de coberturas sem diagnóstico para propriedade ${id_propriedade}:`, error);
      return 0;
    }
  }

  /**
   * Verifica fêmeas vazias para uma propriedade específica.
   * @param id_propriedade - ID da propriedade
   * @returns Número de alertas criados
   */
  async verificarFemeasVaziasPropriedade(id_propriedade: string): Promise<number> {
    this.logger.log(`Verificando fêmeas vazias para propriedade ${id_propriedade}...`);

    try {
      const idadeMinimaReproducao = new Date();
      idadeMinimaReproducao.setMonth(idadeMinimaReproducao.getMonth() - 18);

      const { data: femeas, error } = await this.supabase
        .from('bufalo')
        .select('id_bufalo, nome, dt_nascimento, id_grupo, id_propriedade')
        .eq('sexo', 'F')
        .eq('status', true)
        .lte('dt_nascimento', idadeMinimaReproducao.toISOString())
        .eq('id_propriedade', id_propriedade);

      if (error || !femeas) {
        this.logger.error('Erro ao buscar fêmeas:', error?.message);
        return 0;
      }

      let alertasCriados = 0;
      const hoje = new Date();

      for (const femea of femeas) {
        try {
          const { data: ultimaCobertura } = await this.supabase
            .from('dadosreproducao')
            .select('dt_evento, status')
            .eq('id_bufala', femea.id_bufalo)
            .order('dt_evento', { ascending: false })
            .limit(1)
            .single();

          let diasSemCobertura = 0;

          if (!ultimaCobertura) {
            const idadeMeses = Math.floor((hoje.getTime() - new Date(femea.dt_nascimento).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
            if (idadeMeses < 24) continue;
            diasSemCobertura = 999;
          } else if (ultimaCobertura.status === 'Falhou' || ultimaCobertura.status === 'Concluída') {
            diasSemCobertura = Math.floor((hoje.getTime() - new Date(ultimaCobertura.dt_evento).getTime()) / (1000 * 60 * 60 * 24));
          } else {
            continue;
          }

          if (diasSemCobertura >= 180) {
            let grupoNome = 'Não informado';
            if (femea.id_grupo) {
              const { data: grupoData } = await this.supabase.from('grupo').select('nome_grupo').eq('id_grupo', femea.id_grupo).single();
              if (grupoData) grupoNome = grupoData.nome_grupo;
            }

            let propriedadeNome = 'Não informada';
            if (id_propriedade) {
              const { data: propData } = await this.supabase.from('propriedade').select('nome').eq('id_propriedade', id_propriedade).single();
              if (propData) propriedadeNome = propData.nome;
            }

            const motivoTexto =
              diasSemCobertura === 999
                ? `Fêmea ${femea.nome} apta para reprodução mas nunca foi coberta.`
                : `Fêmea ${femea.nome} sem cobertura há ${diasSemCobertura} dias.`;

            await this.alertasService.createIfNotExists({
              animal_id: femea.id_bufalo,
              grupo: grupoNome,
              localizacao: propriedadeNome,
              id_propriedade: id_propriedade,
              motivo: motivoTexto,
              nicho: NichoAlerta.REPRODUCAO,
              data_alerta: hoje.toISOString().split('T')[0],
              prioridade: PrioridadeAlerta.BAIXA,
              observacao: 'Avaliar aptidão reprodutiva e planejar cobertura/inseminação.',
              id_evento_origem: femea.id_bufalo,
              tipo_evento_origem: 'FEMEA_VAZIA',
            });

            alertasCriados++;
          }
        } catch (error) {
          this.logger.error(`Erro ao processar fêmea ${femea.id_bufalo}:`, error);
        }
      }

      this.logger.log(`Verificação de fêmeas vazias concluída para propriedade ${id_propriedade}: ${alertasCriados} alertas criados.`);
      return alertasCriados;
    } catch (error) {
      this.logger.error(`Erro na verificação de fêmeas vazias para propriedade ${id_propriedade}:`, error);
      return 0;
    }
  }

  /**
   * Verifica vacinações programadas para uma propriedade específica.
   * @param id_propriedade - ID da propriedade
   * @returns Número de alertas criados
   */
  async verificarVacinacoesPropriedade(id_propriedade: string): Promise<number> {
    this.logger.log(`Verificando vacinações para propriedade ${id_propriedade}...`);

    try {
      const hoje = new Date();
      const dataLimite = new Date();
      dataLimite.setDate(hoje.getDate() + ANTECEDENCIA_VACINACAO_DIAS);

      const hojeStr = hoje.toISOString().split('T')[0];
      const dataLimiteStr = dataLimite.toISOString().split('T')[0];

      const { data: vacinacoes, error } = await this.supabase
        .from('vacinacao')
        .select('id_vacinacao, dt_aplicacao, tipo_vacina, id_bufalo, id_propriedade')
        .gte('dt_aplicacao', hojeStr)
        .lte('dt_aplicacao', dataLimiteStr)
        .eq('id_propriedade', id_propriedade);

      if (error || !vacinacoes) {
        this.logger.log('Nenhuma vacinação programada para os próximos 30 dias na propriedade.');
        return 0;
      }

      let alertasCriados = 0;

      for (const vac of vacinacoes) {
        try {
          const { data: bufaloData } = await this.supabase
            .from('bufalo')
            .select('id_bufalo, nome, id_grupo, id_propriedade')
            .eq('id_bufalo', vac.id_bufalo)
            .single();

          if (!bufaloData) continue;

          let grupoNome = 'Não informado';
          if (bufaloData.id_grupo) {
            const { data: grupoData } = await this.supabase.from('grupo').select('nome_grupo').eq('id_grupo', bufaloData.id_grupo).single();
            if (grupoData) grupoNome = grupoData.nome_grupo;
          }

          let propriedadeNome = 'Não informada';
          if (id_propriedade) {
            const { data: propData } = await this.supabase.from('propriedade').select('nome').eq('id_propriedade', id_propriedade).single();
            if (propData) propriedadeNome = propData.nome;
          }

          await this.alertasService.createIfNotExists({
            animal_id: bufaloData.id_bufalo,
            grupo: grupoNome,
            localizacao: propriedadeNome,
            id_propriedade: id_propriedade,
            motivo: `Vacinação programada: ${vac.tipo_vacina} para ${bufaloData.nome}.`,
            nicho: NichoAlerta.SANITARIO,
            data_alerta: vac.dt_aplicacao,
            prioridade: PrioridadeAlerta.MEDIA,
            observacao: `Preparar vacina e equipamentos. Data: ${formatarDataBR(vac.dt_aplicacao)}.`,
            id_evento_origem: vac.id_vacinacao,
            tipo_evento_origem: 'VACINACAO_PROGRAMADA',
          });

          alertasCriados++;
        } catch (error) {
          this.logger.error(`Erro ao processar vacinação ${vac.id_vacinacao}:`, error);
        }
      }

      this.logger.log(`Verificação de vacinações concluída para propriedade ${id_propriedade}: ${alertasCriados} alertas criados.`);
      return alertasCriados;
    } catch (error) {
      this.logger.error(`Erro na verificação de vacinações para propriedade ${id_propriedade}:`, error);
      return 0;
    }
  }
}
