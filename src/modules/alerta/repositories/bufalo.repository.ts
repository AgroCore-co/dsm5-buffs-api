import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/core/supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Repository para busca de dados de búfalos.
 * Isola queries do Supabase da lógica de negócio.
 */
@Injectable()
export class BufaloRepository {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getAdminClient();
  }

  /**
   * Busca búfalo com informações de grupo e propriedade (join).
   */
  async buscarBufaloCompleto(id_bufalo: string) {
    const { data, error } = await this.supabase
      .from('bufalo')
      .select(
        `
        id_bufalo,
        nome,
        id_grupo,
        id_propriedade,
        dt_nascimento,
        grupo:id_grupo(nome_grupo),
        propriedade:id_propriedade(nome)
      `,
      )
      .eq('id_bufalo', id_bufalo)
      .maybeSingle();

    return { data, error };
  }

  /**
   * Busca búfalo simples (sem joins) para performance.
   */
  async buscarBufaloSimples(id_bufalo: string) {
    const { data, error } = await this.supabase
      .from('bufalo')
      .select('id_bufalo, nome, id_grupo, id_propriedade, dt_nascimento')
      .eq('id_bufalo', id_bufalo)
      .maybeSingle();

    return { data, error };
  }

  /**
   * Busca nome do grupo de um búfalo.
   */
  async buscarNomeGrupo(id_grupo: string) {
    const { data, error } = await this.supabase.from('grupo').select('nome_grupo').eq('id_grupo', id_grupo).maybeSingle();

    return { data: data?.nome_grupo || null, error };
  }

  /**
   * Busca nome da propriedade.
   */
  async buscarNomePropriedade(id_propriedade: string) {
    const { data, error } = await this.supabase.from('propriedade').select('nome').eq('id_propriedade', id_propriedade).maybeSingle();

    return { data: data?.nome || null, error };
  }

  /**
   * Busca fêmeas aptas à reprodução de uma propriedade.
   */
  async buscarFemeasAptasReproducao(idadeMinimaData: Date, id_propriedade?: string) {
    let query = this.supabase
      .from('bufalo')
      .select('id_bufalo, nome, dt_nascimento, id_grupo, id_propriedade')
      .eq('sexo', 'F')
      .eq('status', true)
      .lte('dt_nascimento', idadeMinimaData.toISOString());

    if (id_propriedade) {
      query = query.eq('id_propriedade', id_propriedade);
    }

    const { data, error } = await query;
    return { data, error };
  }

  /**
   * Busca todos os búfalos ativos.
   */
  async buscarBufalosAtivos(id_propriedade?: string) {
    let query = this.supabase.from('bufalo').select('id_bufalo, nome, id_grupo, id_propriedade, dt_nascimento').eq('status', true);

    if (id_propriedade) {
      query = query.eq('id_propriedade', id_propriedade);
    }

    const { data, error } = await query;
    return { data, error };
  }

  /**
   * Busca IDs de búfalos de uma propriedade.
   */
  async buscarIdsBufalosPorPropriedade(id_propriedade: string) {
    const { data, error } = await this.supabase.from('bufalo').select('id_bufalo').eq('id_propriedade', id_propriedade);

    return { data: data?.map((b) => b.id_bufalo) || [], error };
  }
}
