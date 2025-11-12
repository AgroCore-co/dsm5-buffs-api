import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/core/supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Repository para busca de dados sanitários.
 * Isola queries do Supabase da lógica de negócio.
 */
@Injectable()
export class SanitarioRepository {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getAdminClient();
  }

  /**
   * Busca tratamentos com retorno agendado nos próximos X dias.
   */
  async buscarTratamentosComRetorno(diasAntecedencia: number, ids_bufalos?: string[]) {
    const hoje = new Date();
    const dataInicio = hoje.toISOString().split('T')[0];

    const dataFim = new Date();
    dataFim.setDate(hoje.getDate() + diasAntecedencia);
    const dataFimString = dataFim.toISOString().split('T')[0];

    let query = this.supabase
      .from('dadossanitarios')
      .select('id_sanit, id_bufalo, doenca, dt_retorno')
      .eq('necessita_retorno', true)
      .gte('dt_retorno', dataInicio)
      .lte('dt_retorno', dataFimString);

    if (ids_bufalos && ids_bufalos.length > 0) {
      query = query.in('id_bufalo', ids_bufalos);
    }

    const { data, error } = await query;
    return { data, error };
  }

  /**
   * Busca múltiplos tratamentos de um búfalo em período específico.
   */
  async buscarTratamentosRecentes(id_bufalo: string, diasAtras: number) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasAtras);

    const { data, error } = await this.supabase
      .from('dadossanitarios')
      .select('id_sanit')
      .eq('id_bufalo', id_bufalo)
      .gte('dt_evento', dataLimite.toISOString());

    return { data, error };
  }
}
