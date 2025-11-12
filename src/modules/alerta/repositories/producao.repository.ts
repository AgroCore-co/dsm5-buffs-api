import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/core/supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Repository para busca de dados de produção de leite.
 * Isola queries do Supabase da lógica de negócio.
 */
@Injectable()
export class ProducaoRepository {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getAdminClient();
  }

  /**
   * Busca produções de leite dos últimos X dias.
   */
  async buscarProducoesRecentes(diasAtras: number, id_propriedade?: string) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasAtras);

    let query = this.supabase
      .from('producaoleite')
      .select('id_bufala, quantidade, dt_ordenha')
      .gte('dt_ordenha', dataLimite.toISOString())
      .order('dt_ordenha', { ascending: false });

    // Filtro por propriedade seria feito via bufalos se necessário
    const { data, error } = await query;
    return { data, error };
  }

  /**
   * Busca ordenhas recentes de uma búfala específica.
   */
  async buscarOrdenhasRecentes(id_bufala: string, diasAtras: number) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasAtras);

    const { data, error } = await this.supabase
      .from('producaoleite')
      .select('id_producao, dt_ordenha, quantidade')
      .eq('id_bufala', id_bufala)
      .gte('dt_ordenha', dataLimite.toISOString())
      .limit(10);

    return { data, error };
  }

  /**
   * Busca vacinações programadas nos próximos X dias.
   */
  async buscarVacinacoesprogramadas(diasAntecedencia: number, ids_bufalos?: string[]) {
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() + diasAntecedencia);

    const hojeStr = hoje.toISOString().split('T')[0];
    const dataLimiteStr = dataLimite.toISOString().split('T')[0];

    let query = this.supabase
      .from('vacinacao')
      .select('id_vacinacao, dt_aplicacao, tipo_vacina, id_bufalo, id_propriedade')
      .gte('dt_aplicacao', hojeStr)
      .lte('dt_aplicacao', dataLimiteStr);

    if (ids_bufalos && ids_bufalos.length > 0) {
      query = query.in('id_bufalo', ids_bufalos);
    }

    const { data, error } = await query;
    return { data, error };
  }

  /**
   * Busca pesagens de um búfalo em período específico.
   */
  async buscarPesagensRecentes(id_bufalo: string, diasAtras: number) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasAtras);

    const { data, error } = await this.supabase
      .from('pesagem')
      .select('peso, dt_pesagem')
      .eq('id_bufalo', id_bufalo)
      .gte('dt_pesagem', dataLimite.toISOString())
      .order('dt_pesagem', { ascending: true });

    return { data, error };
  }
}
