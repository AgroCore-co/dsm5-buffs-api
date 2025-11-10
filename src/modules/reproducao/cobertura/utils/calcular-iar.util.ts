/**
 * Utilitários para cálculo do Índice de Aptidão Reprodutiva (IAR) de fêmeas
 * Baseado em fundamentos zootécnicos para búfalos
 *
 * Referências:
 * - Período de Espera Voluntário (PEV): 63 dias
 * - Idade primeira cobertura: 24-36 meses
 * - Intervalo Entre Partos (IEP) ideal: 365-400 dias
 * - Pico de lactação: 20-80 dias pós-parto
 */

export interface FatoresPonderacao {
  fp_prontidao: number; // 0-100
  fp_idade: number; // 0-100
  fp_historico: number; // 0-100
  fp_lactacao: number; // 0-100
}

/**
 * Calcula o Fator de Prontidão Fisiológica (FP_Prontidao)
 * Peso: 50% do score final
 *
 * Avalia se o animal está biologicamente apto HOJE para cobertura
 */
export function calcularFPProntidao(numeroCiclos: number, idadeMeses: number, diasPosParto: number | null): number {
  // Caso 1: Novilha (nunca pariu)
  if (numeroCiclos === 0) {
    if (idadeMeses < 24) {
      return 0; // Imatura
    }
    if (idadeMeses >= 24 && idadeMeses <= 36) {
      return 100; // Janela ótima para 1ª concepção
    }
    if (idadeMeses > 36) {
      // Penaliza novilhas atrasadas (decai 8.33 pts/mês, zera aos 48m)
      return Math.max(0, 100 - (idadeMeses - 36) * 8.33);
    }
  }

  // Caso 2: Pós-Parto (já teve pelo menos um parto)
  if (diasPosParto === null) {
    return 0; // Sem dados de parto, não pode avaliar
  }

  const PEV = 63; // Período de Espera Voluntário (dias)

  if (diasPosParto < PEV) {
    return 0; // Inapta, aguardando involução uterina
  }

  if (diasPosParto >= PEV && diasPosParto <= 120) {
    return 100; // Janela ótima para concepção
  }

  if (diasPosParto > 120) {
    // Penalização por Dias em Aberto (DEA) elevados
    // Decai 0.4 ponto/dia, zerando após ~1 ano pós-parto
    return Math.max(0, 100 - (diasPosParto - 120) * 0.4);
  }

  return 0;
}

/**
 * Calcula o Fator de Janela de Idade Produtiva (FP_Idade)
 * Peso: 15% do score final
 *
 * Avalia a fêmea dentro de sua vida produtiva esperada
 */
export function calcularFPIdade(idadeMeses: number, numeroCiclos: number): number {
  // Para novilhas, a idade já está considerada no FP_Prontidao
  if (numeroCiclos === 0) {
    return 100;
  }

  // Para fêmeas pós-parto
  if (idadeMeses < 36) {
    return 90; // Primípara jovem (apta, mas ainda em crescimento)
  }

  if (idadeMeses >= 36 && idadeMeses <= 120) {
    return 100; // Pico da vida produtiva (3-10 anos)
  }

  if (idadeMeses >= 121 && idadeMeses <= 144) {
    return 70; // Idade avançada (10-12 anos), menor persistência
  }

  if (idadeMeses > 144) {
    return 30; // Alto risco, fim de vida produtiva
  }

  return 100;
}

/**
 * Calcula o Fator de Eficiência Reprodutiva Histórica (FP_Historico)
 * Peso: 20% do score final
 *
 * Avalia o desempenho passado usando o Intervalo Entre Partos (IEP) médio
 * IEP ideal: 365-400 dias
 */
export function calcularFPHistorico(numeroCiclos: number, iepMedioDias: number | null): number {
  // Caso 1: Novilha (sem histórico)
  if (numeroCiclos === 0) {
    return 85; // Default neutro/positivo
  }

  // Caso 2: Apenas um ciclo (não tem IEP calculável)
  if (numeroCiclos === 1 || iepMedioDias === null) {
    return 85; // Default neutro
  }

  // Caso 3: Avalia baseado no IEP médio
  if (iepMedioDias <= 400) {
    return 100; // Excelente
  }

  if (iepMedioDias > 400 && iepMedioDias <= 450) {
    return 70; // Bom
  }

  if (iepMedioDias > 450 && iepMedioDias <= 500) {
    return 40; // Ruim
  }

  if (iepMedioDias > 500) {
    return 10; // Muito ruim
  }

  return 85;
}

/**
 * Calcula o Modulador de Lactação (FP_Lactacao)
 * Peso: 15% do score final
 *
 * Penaliza durante o pico de demanda energética (20-80 dias)
 * Pico de lactação coincide com janela reprodutiva, criando conflito metabólico
 */
export function calcularFPLactacao(statusLactacao: string, diasEmLactacao: number | null): number {
  // Caso 1: Seca ou Novilha
  if (statusLactacao !== 'Em Lactação' || diasEmLactacao === null) {
    return 100; // Sem conflito energético
  }

  // Caso 2: Em Lactação
  if (diasEmLactacao >= 20 && diasEmLactacao <= 80) {
    return 60; // Penalização por pico de lactação
  }

  // Fora do pico (< 20 ou > 80 dias)
  return 100;
}

/**
 * Calcula o IAR Score final (0-100)
 *
 * IAR = (FP_Prontidao * 0.50) + (FP_Idade * 0.15) + (FP_Historico * 0.20) + (FP_Lactacao * 0.15)
 */
export function calcularIAR(fatores: FatoresPonderacao): number {
  const score = fatores.fp_prontidao * 0.5 + fatores.fp_idade * 0.15 + fatores.fp_historico * 0.2 + fatores.fp_lactacao * 0.15;

  // Arredondar para 1 casa decimal
  return Math.round(score * 10) / 10;
}

/**
 * Gera motivos (justificativas) baseados nos fatores
 */
export function gerarMotivosIAR(
  fatores: FatoresPonderacao,
  numeroCiclos: number,
  diasPosParto: number | null,
  idadeMeses: number,
  iepMedioDias: number | null,
  diasEmLactacao: number | null,
): string[] {
  const motivos: string[] = [];

  // FP_Prontidao
  if (fatores.fp_prontidao === 0) {
    if (numeroCiclos === 0 && idadeMeses < 24) {
      motivos.push('Novilha imatura para cobertura');
    } else if (diasPosParto !== null && diasPosParto < 63) {
      motivos.push('Aguardando Período de Espera Voluntário (63 dias)');
    }
  } else if (fatores.fp_prontidao === 100) {
    if (numeroCiclos === 0) {
      motivos.push('Idade ideal para primeira cobertura');
    } else if (diasPosParto !== null && diasPosParto >= 63 && diasPosParto <= 120) {
      motivos.push('Janela ideal pós-parto para cobertura');
    }
  } else if (fatores.fp_prontidao < 70 && diasPosParto !== null && diasPosParto > 120) {
    motivos.push(`Alerta: Dias em Aberto elevados (${diasPosParto} dias)`);
  }

  // FP_Historico
  if (fatores.fp_historico < 70 && iepMedioDias !== null) {
    motivos.push(`Histórico de Intervalo entre Partos longo (${iepMedioDias} dias)`);
  } else if (fatores.fp_historico === 100 && iepMedioDias !== null) {
    motivos.push('Histórico de IEP excelente');
  }

  // FP_Lactacao
  if (fatores.fp_lactacao < 100 && diasEmLactacao !== null) {
    motivos.push('Em pico de lactação (alta demanda energética)');
  }

  // FP_Idade
  if (fatores.fp_idade === 30) {
    motivos.push('Idade avançada (>12 anos) - fim de vida produtiva');
  }

  return motivos;
}
