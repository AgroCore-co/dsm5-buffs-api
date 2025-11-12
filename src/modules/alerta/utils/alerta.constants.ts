/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONSTANTES DE CONFIGURAÇÃO DO SISTEMA DE ALERTAS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Centralizadas para fácil manutenção e ajuste.
 * Modifique estes valores conforme necessário para diferentes raças ou práticas de manejo.
 */

/**
 * Constantes de configuração do sistema de alertas.
 */
export const AlertaConstants = {
  // ========================================================================
  // REPRODUÇÃO
  // ========================================================================

  /**
   * Tempo médio de gestação de búfalos em dias.
   * Usado para calcular data prevista de parto a partir da data de cobertura.
   * @default 315 - Aproximadamente 10.5 meses
   */
  TEMPO_GESTACAO_DIAS: 315,

  /**
   * Antecedência em dias para criar alerta de parto previsto.
   * Alerta será gerado X dias ANTES da data prevista de parto.
   * @default 30 - 1 mês de antecedência para preparação
   */
  ANTECEDENCIA_PARTO_DIAS: 30,

  /**
   * Dias sem cobertura para alertar sobre fêmea vazia.
   * @default 180 - 6 meses sem atividade reprodutiva
   */
  DIAS_SEM_COBERTURA_FEMEA_VAZIA: 180,

  /**
   * Dias sem diagnóstico após cobertura para gerar alerta.
   * @default 90 - Recomenda-se diagnóstico entre 45-60 dias
   */
  DIAS_SEM_DIAGNOSTICO_COBERTURA: 90,

  /**
   * Idade mínima para reprodução em meses.
   * @default 18 - Primeira cobertura recomendada
   */
  IDADE_MINIMA_REPRODUCAO_MESES: 18,

  // ========================================================================
  // SANITÁRIO
  // ========================================================================

  /**
   * Antecedência em dias para criar alerta de retorno de tratamento sanitário.
   * Alerta será gerado X dias ANTES da data de retorno agendada.
   * @default 15 - 2 semanas de antecedência
   */
  ANTECEDENCIA_SANITARIO_DIAS: 15,

  /**
   * Antecedência em dias para criar alerta de vacinação programada.
   * Alerta será gerado X dias ANTES da data programada de aplicação.
   * @default 30 - 1 mês de antecedência para compra e planejamento
   */
  ANTECEDENCIA_VACINACAO_DIAS: 30,

  // ========================================================================
  // PRODUÇÃO
  // ========================================================================

  /**
   * Percentual mínimo de queda de produção de leite para gerar alerta.
   * Compara média dos últimos 7 dias com média dos 30 dias anteriores.
   * @default 20 - Queda de 20% ou mais gera alerta
   */
  QUEDA_PRODUCAO_PERCENTUAL_MINIMO: 20,

  /**
   * Percentual de queda considerado crítico (prioridade ALTA).
   * @default 40 - Queda de 40% ou mais = ALTA prioridade
   */
  QUEDA_PRODUCAO_CRITICA: 40,

  /**
   * Número de dias para análise de produção recente.
   * @default 7 - Última semana
   */
  DIAS_ANALISE_PRODUCAO_RECENTE: 7,

  /**
   * Número de dias para análise de produção histórica.
   * @default 30 - Último mês (excluindo os últimos 7 dias)
   */
  DIAS_ANALISE_PRODUCAO_HISTORICO: 30,

  /**
   * Número mínimo de registros de produção nos últimos 7 dias para análise confiável.
   * @default 3 - Mínimo 3 ordenhas registradas
   */
  MIN_REGISTROS_PRODUCAO_7_DIAS: 3,

  /**
   * Número mínimo de registros de produção nos 30 dias anteriores para análise confiável.
   * @default 10 - Mínimo 10 ordenhas registradas
   */
  MIN_REGISTROS_PRODUCAO_30_DIAS: 10,

  // ========================================================================
  // MANEJO
  // ========================================================================

  /**
   * Dias antes do parto previsto para alertar sobre secagem pendente.
   * Búfalas gestantes devem ser secas (parar ordenha) neste período.
   * @default 60 - 2 meses de descanso antes do parto
   */
  DIAS_SECAGEM_ANTES_PARTO: 60,

  /**
   * Janela final para secagem (dias antes do parto).
   * Alerta com prioridade ALTA se ainda não secou.
   * @default 45 - Últimos 45 dias são críticos
   */
  DIAS_SECAGEM_JANELA_FINAL: 45,

  /**
   * Dias para verificar ordenhas recentes ao checar secagem.
   * @default 7 - Última semana
   */
  DIAS_VERIFICACAO_ORDENHA_SECAGEM: 7,

  // ========================================================================
  // CLÍNICO
  // ========================================================================

  /**
   * Número mínimo de tratamentos em período curto para alertar sobre possível fragilidade.
   * Indica animal com baixa imunidade ou condições inadequadas.
   * @default 3 - 3 ou mais tratamentos em 60 dias
   */
  TRATAMENTOS_MULTIPLOS_THRESHOLD: 3,

  /**
   * Ganho mínimo de peso esperado em 60 dias (kg).
   * Valores abaixo indicam problema de alimentação, parasitas ou doença.
   * @default 5 - 5kg em 60 dias (mínimo esperado)
   */
  GANHO_PESO_MINIMO_60_DIAS: 5,

  /**
   * Período de análise de peso em dias.
   * @default 60 - 2 meses
   */
  PERIODO_ANALISE_PESO_DIAS: 60,

  /**
   * Número mínimo de pesagens para análise confiável.
   * @default 2 - Mínimo 2 pesagens (inicial e final)
   */
  MIN_PESAGENS_ANALISE: 2,
} as const;

/**
 * Helper para formatar datas no padrão brasileiro.
 * @param date - Data a ser formatada (string ISO ou objeto Date)
 * @returns String formatada no padrão dd/MM/yyyy
 */
export const formatarDataBR = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

/**
 * Helper para calcular idade em meses.
 * @param dtNascimento - Data de nascimento (string ISO ou Date)
 * @returns Idade em meses
 */
export const calcularIdadeEmMeses = (dtNascimento: string | Date): number => {
  const hoje = new Date();
  const nascimento = typeof dtNascimento === 'string' ? new Date(dtNascimento) : dtNascimento;
  const diffMeses = (hoje.getFullYear() - nascimento.getFullYear()) * 12 + (hoje.getMonth() - nascimento.getMonth());
  return diffMeses;
};

/**
 * Helper para calcular diferença de dias entre duas datas.
 * @param dataInicial - Data inicial
 * @param dataFinal - Data final (padrão: hoje)
 * @returns Número de dias entre as datas
 */
export const calcularDiferencaDias = (dataInicial: Date, dataFinal: Date = new Date()): number => {
  return Math.floor((dataFinal.getTime() - dataInicial.getTime()) / (1000 * 60 * 60 * 24));
};
