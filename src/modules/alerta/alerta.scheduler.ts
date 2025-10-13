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

@Injectable()
export class AlertasScheduler {
  private readonly logger = new Logger(AlertasScheduler.name);
  private supabase: SupabaseClient;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly alertasService: AlertasService,
  ) {
    this.supabase = this.supabaseService.getClient();
  }

  /**
   * Executa todo dia à meia-noite para verificar tratamentos sanitários agendados.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async verificarTratamentos() {
    this.logger.log('Iniciando verificação de tratamentos sanitários agendados...');

    try {
      const dataAlvo = new Date();
      dataAlvo.setDate(dataAlvo.getDate() + ANTECEDENCIA_SANITARIO_DIAS);
      const dataAlvoString = dataAlvo.toISOString().split('T')[0];

      // Busca tratamentos que precisam de retorno na data alvo
      const { data: tratamentos, error } = await this.supabase
        .from('dadossanitarios')
        .select('id_sanit, dt_retorno, doenca, id_bufalo, id_propriedade')
        .eq('necessita_retorno', true)
        .eq('dt_retorno', dataAlvoString);

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
          const propriedadeId = tratamento.id_propriedade || bufaloData.id_propriedade;
          if (propriedadeId) {
            const { data: propData } = await this.supabase.from('propriedade').select('nome').eq('id_propriedade', propriedadeId).single();

            if (propData) {
              propriedadeNome = propData.nome;
            }
          }

          const alertaDto: CreateAlertaDto = {
            animal_id: bufaloData.id_bufalo,
            grupo: grupoNome,
            localizacao: propriedadeNome,
            id_propriedade: propriedadeId,
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
              observacao: `Preparar área de maternidade. Gestação confirmada em ${new Date(rep.dt_evento).toLocaleDateString('pt-BR')}.`,
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
}
