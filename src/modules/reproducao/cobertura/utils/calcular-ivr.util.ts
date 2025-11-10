/**
 * Utilitários para cálculo do Índice de Valor Reprodutivo (IVR) de machos
 * Baseado em Taxa de Concepção Ajustada com Regressão Bayesiana
 *
 * Referências:
 * - Taxa de Concepção benchmark: 55-75% (búfalos), 44-64% (bovinos Nelore)
 * - Fator de Confiabilidade (K): 20 coberturas
 * - Perímetro Escrotal: Alta herdabilidade e correlação com fertilidade
 */

export interface DadosIVR {
  /** Número de coberturas do touro */
  n_touro: number;
  /** Taxa de Concepção Bruta do touro (0-100) */
  tcb_touro: number;
  /** Média do Rebanho (taxa de concepção média da propriedade, 0-100) */
  mr_tc: number;
}

export interface ResultadoIVR {
  /** Taxa de Concepção Ajustada (0-100) */
  tca: number;
  /** Score IVR normalizado (0-100) */
  score: number;
  /** Nível de confiabilidade */
  confiabilidade: 'Baixa' | 'Média' | 'Alta';
}

/**
 * Fator de Confiabilidade (K)
 * Representa o número de coberturas necessárias para que a TC do touro
 * tenha mais peso que a média do rebanho
 */
const K = 20;

/**
 * Taxa de concepção máxima para normalização (90%)
 * Usada como teto para converter TCA em score 0-100
 */
const MR_TC_MAX = 90;

/**
 * Calcula a Taxa de Concepção Ajustada (TCA) usando Regressão Bayesiana Simples
 *
 * Fórmula: TCA = ((N * TCB) + (K * MR)) / (N + K)
 *
 * Esta fórmula "puxa" estimativas com baixo N em direção à média do rebanho,
 * evitando supervalorizar touros com poucas coberturas e alta TC.
 *
 * @param dados - Dados do touro e média do rebanho
 * @returns Taxa de Concepção Ajustada (0-100)
 */
export function calcularTCA(dados: DadosIVR): number {
  const { n_touro, tcb_touro, mr_tc } = dados;

  // Converter percentagens para proporções (0-1)
  const tcb = tcb_touro / 100;
  const mr = mr_tc / 100;

  // Aplicar fórmula de regressão
  const tca_proporcao = (n_touro * tcb + K * mr) / (n_touro + K);

  // Converter de volta para percentagem
  const tca = tca_proporcao * 100;

  // Arredondar para 1 casa decimal
  return Math.round(tca * 10) / 10;
}

/**
 * Determina o nível de confiabilidade baseado no número de observações
 *
 * - Baixa: < 10 coberturas
 * - Média: 10-29 coberturas
 * - Alta: >= 30 coberturas
 */
export function determinarConfiabilidade(n: number): 'Baixa' | 'Média' | 'Alta' {
  if (n < 10) return 'Baixa';
  if (n < 30) return 'Média';
  return 'Alta';
}

/**
 * Normaliza a TCA para um score 0-100
 *
 * Score = (TCA / MR_TC_MAX) * 100
 *
 * Um touro com TCA de 90% (máximo esperado) recebe score 100
 */
export function normalizarScore(tca: number): number {
  const score = (tca / MR_TC_MAX) * 100;

  // Limitar entre 0-100
  const scoreLimitado = Math.max(0, Math.min(100, score));

  // Arredondar para 1 casa decimal
  return Math.round(scoreLimitado * 10) / 10;
}

/**
 * Calcula o IVR completo (TCA, Score e Confiabilidade)
 */
export function calcularIVR(dados: DadosIVR): ResultadoIVR {
  const tca = calcularTCA(dados);
  const score = normalizarScore(tca);
  const confiabilidade = determinarConfiabilidade(dados.n_touro);

  return {
    tca,
    score,
    confiabilidade,
  };
}

/**
 * Gera motivos (justificativas) para o score IVR
 */
export function gerarMotivosIVR(resultado: ResultadoIVR, n_touro: number, tcb_touro: number): string[] {
  const motivos: string[] = [];

  // Motivo 1: TCA
  motivos.push(`Taxa de Concepção Ajustada: ${resultado.tca.toFixed(1)}%`);

  // Motivo 2: Confiabilidade
  motivos.push(`Confiabilidade: ${resultado.confiabilidade} (${n_touro} cobertura${n_touro !== 1 ? 's' : ''} registrada${n_touro !== 1 ? 's' : ''})`);

  // Motivo 3: Ajuste aplicado (se N < K)
  if (n_touro < K) {
    motivos.push(`Score ajustado para a média do rebanho devido a baixo número de observações (N < ${K})`);
  }

  // Motivo 4: Diferença entre TCB e TCA (se significativa)
  const diferenca = Math.abs(tcb_touro - resultado.tca);
  if (diferenca > 10) {
    if (tcb_touro > resultado.tca) {
      motivos.push(`TC Bruta (${tcb_touro.toFixed(1)}%) ajustada para baixo devido à baixa confiabilidade`);
    } else {
      motivos.push(`TC Bruta (${tcb_touro.toFixed(1)}%) ajustada para cima baseada na média do rebanho`);
    }
  }

  return motivos;
}

/**
 * Calcula a média do rebanho (MR_TC)
 *
 * MR_TC = (Total de Prenhezes) / (Total de Coberturas)
 *
 * @param totalPrenhezes - Total de prenhezes da propriedade
 * @param totalCoberturas - Total de coberturas da propriedade
 * @returns Taxa de concepção média (0-100)
 */
export function calcularMediaRebanho(totalPrenhezes: number, totalCoberturas: number): number {
  if (totalCoberturas === 0) {
    return 55; // Default: 55% (benchmark médio para búfalos)
  }

  const mr = (totalPrenhezes / totalCoberturas) * 100;

  // Arredondar para 1 casa decimal
  return Math.round(mr * 10) / 10;
}
