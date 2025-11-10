import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Utilitários para queries relacionadas à reprodução
 * Centraliza todas as consultas ao banco para facilitar manutenção e reutilização
 */

/**
 * Busca o ciclo de lactação ativo (mais recente) de uma búfala
 */
export async function buscarCicloAtivo(supabase: SupabaseClient, id_bufala: string) {
  const { data, error } = await supabase
    .from('ciclolactacao')
    .select('dt_parto, status')
    .eq('id_bufala', id_bufala)
    .order('dt_parto', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = sem resultados (não é erro real)
    console.error('Erro ao buscar ciclo ativo:', error);
  }

  return data;
}

/**
 * Conta o total de ciclos de lactação (partos) de uma búfala
 */
export async function contarCiclosTotais(supabase: SupabaseClient, id_bufala: string): Promise<number> {
  const { count, error } = await supabase.from('ciclolactacao').select('*', { count: 'exact', head: true }).eq('id_bufala', id_bufala);

  if (error) {
    console.error('Erro ao contar ciclos:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Calcula o Intervalo Entre Partos (IEP) médio de uma fêmea
 * IEP = Intervalo em dias entre partos consecutivos
 *
 * @param supabase - Cliente Supabase
 * @param id_bufala - ID da búfala
 * @param numeroCiclos - Número total de ciclos/partos
 * @returns IEP médio em dias (null se < 2 partos)
 */
export async function calcularIEPMedio(supabase: SupabaseClient, id_bufala: string, numeroCiclos: number): Promise<number | null> {
  if (numeroCiclos < 2) {
    return null; // Precisa de pelo menos 2 partos para calcular intervalo
  }

  const { data: ciclos, error } = await supabase
    .from('ciclolactacao')
    .select('dt_parto')
    .eq('id_bufala', id_bufala)
    .order('dt_parto', { ascending: true });

  if (error || !ciclos || ciclos.length < 2) {
    return null;
  }

  // Calcular intervalos entre partos consecutivos
  const intervalos: number[] = [];
  for (let i = 1; i < ciclos.length; i++) {
    const dtAnterior = new Date(ciclos[i - 1].dt_parto);
    const dtAtual = new Date(ciclos[i].dt_parto);
    const intervalo = Math.floor((dtAtual.getTime() - dtAnterior.getTime()) / (1000 * 60 * 60 * 24));
    intervalos.push(intervalo);
  }

  // Calcular média
  const soma = intervalos.reduce((acc, val) => acc + val, 0);
  return Math.round(soma / intervalos.length);
}

/**
 * Busca histórico de coberturas de um touro/reprodutor
 * Usa tipo_parto como indicador de sucesso (Normal/Cesárea = prenhez confirmada)
 *
 * @param supabase - Cliente Supabase
 * @param id_reprodutor - ID do búfalo reprodutor
 * @returns Estatísticas de cobertura do reprodutor
 */
export async function buscarHistoricoCoberturasTouro(supabase: SupabaseClient, id_reprodutor: string) {
  // Buscar coberturas onde o touro foi usado (monta natural ou sêmen)
  const { data: coberturas, error } = await supabase
    .from('dadosreproducao')
    .select('tipo_parto, dt_evento, id_bufalo, id_semen')
    .or(`id_bufalo.eq.${id_reprodutor},id_semen.eq.${id_reprodutor}`)
    .not('tipo_parto', 'is', null); // Apenas coberturas com resultado definido

  if (error) {
    console.error('Erro ao buscar histórico de coberturas:', error);
    return {
      total_coberturas: 0,
      total_prenhezes: 0,
      ultima_cobertura: null,
      dias_desde_ultima: null,
    };
  }

  const total_coberturas = coberturas?.length || 0;

  // Contar prenhezes: tipo_parto = 'Normal' ou 'Cesárea' (Aborto não conta como sucesso)
  const total_prenhezes = coberturas?.filter((c) => c.tipo_parto === 'Normal' || c.tipo_parto === 'Cesárea').length || 0;

  // Última cobertura (mais recente com resultado)
  const ultima_cobertura = coberturas && coberturas.length > 0 ? coberturas[coberturas.length - 1].dt_evento : null;

  const dias_desde_ultima = ultima_cobertura ? Math.floor((Date.now() - new Date(ultima_cobertura).getTime()) / (1000 * 60 * 60 * 24)) : null;

  return {
    total_coberturas,
    total_prenhezes,
    ultima_cobertura,
    dias_desde_ultima,
  };
}

/**
 * Calcula estatísticas gerais do rebanho da propriedade
 * Usa tipo_parto como indicador de sucesso
 *
 * @param supabase - Cliente Supabase
 * @param id_propriedade - ID da propriedade
 * @returns Total de coberturas e prenhezes confirmadas
 */
export async function estatisticasRebanho(supabase: SupabaseClient, id_propriedade: string) {
  const { data: coberturas, error } = await supabase
    .from('dadosreproducao')
    .select('tipo_parto')
    .eq('id_propriedade', id_propriedade)
    .not('tipo_parto', 'is', null);

  if (error) {
    console.error('Erro ao buscar estatísticas do rebanho:', error);
    return { totalPrenhezes: 0, totalCoberturas: 0 };
  }

  const totalCoberturas = coberturas?.length || 0;
  const totalPrenhezes = coberturas?.filter((c) => c.tipo_parto === 'Normal' || c.tipo_parto === 'Cesárea').length || 0;

  return { totalPrenhezes, totalCoberturas };
}
