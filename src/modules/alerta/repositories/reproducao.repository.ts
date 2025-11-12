import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/core/supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Repository para busca de dados de reprodução.
 * Isola queries do Supabase da lógica de negócio.
 */
@Injectable()
export class ReproducaoRepository {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getAdminClient();
  }

  /**
   * Busca coberturas confirmadas (gestações) de uma propriedade ou todas.
   */
  async buscarGestacoesConfirmadas(id_propriedade?: string) {
    let query = this.supabase.from('dadosreproducao').select('id_reproducao, dt_evento, id_bufala, id_propriedade').eq('status', 'Confirmada');

    if (id_propriedade) {
      query = query.eq('id_propriedade', id_propriedade);
    }

    const { data, error } = await query;
    return { data, error };
  }

  /**
   * Busca coberturas sem diagnóstico há mais de X dias.
   */
  async buscarCoberturasSemDiagnostico(diasMinimos: number, id_propriedade?: string) {
    const hoje = new Date();
    const dataLimite = new Date(hoje.getTime() - diasMinimos * 24 * 60 * 60 * 1000);

    let query = this.supabase
      .from('dadosreproducao')
      .select('id_reproducao, dt_evento, id_bufala, id_propriedade, tipo_inseminacao')
      .eq('status', 'Em andamento')
      .lte('dt_evento', dataLimite.toISOString());

    if (id_propriedade) {
      query = query.eq('id_propriedade', id_propriedade);
    }

    const { data, error } = await query;
    return { data, error };
  }

  /**
   * Busca última cobertura de uma búfala específica.
   */
  async buscarUltimaCobertura(id_bufala: string) {
    const { data, error } = await this.supabase
      .from('dadosreproducao')
      .select('dt_evento, status')
      .eq('id_bufala', id_bufala)
      .order('dt_evento', { ascending: false })
      .limit(1)
      .maybeSingle();

    return { data, error };
  }
}
