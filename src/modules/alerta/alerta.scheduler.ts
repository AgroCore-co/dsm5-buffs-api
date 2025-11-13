import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertaReproducaoService } from './services/alerta-reproducao.service';
import { AlertaSanitarioService } from './services/alerta-sanitario.service';
import { AlertaProducaoService } from './services/alerta-producao.service';
import { AlertaManejoService } from './services/alerta-manejo.service';
import { AlertaClinicoService } from './services/alerta-clinico.service';
import { SupabaseService } from 'src/core/supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SCHEDULER DE ALERTAS - ORQUESTRADOR
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Responsabilidade: Orquestrar a execução dos schedulers de alertas.
 * Delega toda a lógica de negócio aos serviços de domínio.
 *
 * Horários dos CRON jobs:
 * - 00:00 - Tratamentos sanitários (SANITARIO)
 * - 00:05 - Nascimentos previstos (REPRODUCAO)
 * - 01:00 - Coberturas sem diagnóstico (REPRODUCAO)
 * - 02:00 - Fêmeas vazias (REPRODUCAO)
 * - 03:00 - Vacinações programadas (SANITARIO)
 * - 04:00 - Queda de produção de leite (PRODUCAO)
 * - 05:00 - Secagem pendente (MANEJO)
 * - 06:00 - Sinais clínicos precoces (CLINICO)
 */
@Injectable()
export class AlertasScheduler {
  private readonly logger = new Logger(AlertasScheduler.name);
  private supabase: SupabaseClient;

  constructor(
    private readonly reproducaoService: AlertaReproducaoService,
    private readonly sanitarioService: AlertaSanitarioService,
    private readonly producaoService: AlertaProducaoService,
    private readonly manejoService: AlertaManejoService,
    private readonly clinicoService: AlertaClinicoService,
    private readonly supabaseService: SupabaseService,
  ) {
    this.supabase = this.supabaseService.getAdminClient();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SANITÁRIO
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Verifica tratamentos com retorno programado.
   * @cron "0 0 * * *" (todo dia à meia-noite)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async verificarTratamentos() {
    this.logger.log('🩺 [SCHEDULER] Iniciando verificação de tratamentos...');
    await this.sanitarioService.verificarTratamentos();
    this.logger.log('✅ [SCHEDULER] Verificação de tratamentos concluída.');
  }

  /**
   * Verifica vacinações programadas.
   * @cron "0 3 * * *" (todo dia às 03:00)
   */
  @Cron('0 3 * * *')
  async verificarVacinacoes() {
    this.logger.log('💉 [SCHEDULER] Iniciando verificação de vacinações...');
    await this.sanitarioService.verificarVacinacoes();
    this.logger.log('✅ [SCHEDULER] Verificação de vacinações concluída.');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // REPRODUÇÃO
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Verifica nascimentos previstos para os próximos 30 dias.
   * @cron "5 0 * * *" (todo dia às 00:05)
   */
  @Cron('5 0 * * *')
  async verificarNascimentos() {
    this.logger.log('🐃 [SCHEDULER] Iniciando verificação de nascimentos...');
    await this.reproducaoService.verificarNascimentos();
    this.logger.log('✅ [SCHEDULER] Verificação de nascimentos concluída.');
  }

  /**
   * Verifica coberturas sem diagnóstico há mais de 90 dias.
   * @cron "0 1 * * *" (todo dia às 01:00)
   */
  @Cron('0 1 * * *')
  async verificarCoberturaSemDiagnostico() {
    this.logger.log('🔬 [SCHEDULER] Iniciando verificação de coberturas...');
    await this.reproducaoService.verificarCoberturaSemDiagnostico();
    this.logger.log('✅ [SCHEDULER] Verificação de coberturas concluída.');
  }

  /**
   * Verifica fêmeas vazias há mais de 180 dias.
   * @cron "0 2 * * *" (todo dia às 02:00)
   */
  @Cron('0 2 * * *')
  async verificarFemeasVazias() {
    this.logger.log('🚺 [SCHEDULER] Iniciando verificação de fêmeas vazias...');
    await this.reproducaoService.verificarFemeasVazias();
    this.logger.log('✅ [SCHEDULER] Verificação de fêmeas vazias concluída.');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRODUÇÃO
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Verifica quedas significativas na produção de leite.
   * @cron "0 4 * * *" (todo dia às 04:00)
   */
  @Cron('0 4 * * *')
  async verificarQuedaProducao() {
    this.logger.log('🥛 [SCHEDULER] Iniciando verificação de queda de produção...');
    await this.producaoService.verificarQuedaProducao();
    this.logger.log('✅ [SCHEDULER] Verificação de queda de produção concluída.');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MANEJO
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Verifica búfalas gestantes que precisam ser secas.
   * @cron "0 5 * * *" (todo dia às 05:00)
   */
  @Cron('0 5 * * *')
  async verificarSecagemPendente() {
    this.logger.log('🛑 [SCHEDULER] Iniciando verificação de secagem pendente...');
    await this.manejoService.verificarSecagemPendente();
    this.logger.log('✅ [SCHEDULER] Verificação de secagem pendente concluída.');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CLÍNICO
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Verifica sinais clínicos precoces (múltiplos tratamentos, ganho de peso insuficiente).
   * Executa para TODAS as propriedades do sistema.
   * @cron "0 6 * * *" (todo dia às 06:00)
   */
  @Cron('0 6 * * *')
  async verificarSinaisClinicosPrecoces() {
    this.logger.log('🩹 [SCHEDULER] Iniciando verificação de sinais clínicos precoces...');

    try {
      // Buscar todas as propriedades ativas do sistema
      const { data: propriedades, error } = await this.supabase.from('propriedade').select('id_propriedade').is('deleted_at', null);

      if (error || !propriedades || propriedades.length === 0) {
        this.logger.warn('⚠️  [SCHEDULER] Nenhuma propriedade encontrada para verificação clínica.');
        return;
      }

      this.logger.log(`📋 [SCHEDULER] Verificando ${propriedades.length} propriedade(s)...`);

      let totalAlertas = 0;
      for (const prop of propriedades) {
        try {
          const alertas = await this.clinicoService.verificarSinaisClinicosPrecoces(prop.id_propriedade);
          totalAlertas += alertas;
        } catch (error) {
          this.logger.error(`❌ [SCHEDULER] Erro ao verificar propriedade ${prop.id_propriedade}:`, error.message);
        }
      }

      this.logger.log(`✅ [SCHEDULER] Verificação de sinais clínicos concluída. Total: ${totalAlertas} alertas criados.`);
    } catch (error) {
      this.logger.error('❌ [SCHEDULER] Erro crítico na verificação de sinais clínicos:', error);
    }
  }
}
