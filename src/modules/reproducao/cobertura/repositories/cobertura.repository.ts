import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/core/supabase/supabase.service';

/**
 * Repository para queries de coberturas.
 * Isola acesso ao banco de dados da lógica de negócio.
 *
 * **Responsabilidades:**
 * - Executar queries no Supabase
 * - Retornar dados brutos (sem processamento)
 * - Não contém lógica de negócio
 */
@Injectable()
export class CoberturaRepository {
  private readonly tableName = 'dadosreproducao';

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Query base para coberturas com joins (fêmea e macho).
   * Todas as outras queries usam esta como base.
   */
  private getBaseQuery() {
    return this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select(
        `
        *,
        femea:id_bufala(id_bufalo, nome, brinco, microchip),
        macho:id_bufalo(id_bufalo, nome, brinco, microchip)
      `,
      );
  }

  /**
   * Busca cobertura completa por ID com todos os relacionamentos.
   */
  async findById(id_reproducao: string) {
    return this.getBaseQuery().eq('id_reproducao', id_reproducao).single();
  }

  /**
   * Busca coberturas com paginação.
   *
   * @param pagination Paginação (offset, limit)
   * @param includeDeleted Se deve incluir registros deletados
   * @returns Coberturas paginadas
   */
  async findAll(pagination: { offset: number; limit: number }, includeDeleted: boolean = false) {
    let query = this.getBaseQuery();

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    return query.order('dt_evento', { ascending: false }).range(pagination.offset, pagination.offset + pagination.limit - 1);
  }

  /**
   * Busca coberturas por propriedade com paginação.
   *
   * @param id_propriedade ID da propriedade
   * @param pagination Paginação (offset, limit)
   * @returns Coberturas da propriedade
   */
  async findByPropriedade(id_propriedade: string, pagination: { offset: number; limit: number }) {
    return this.getBaseQuery()
      .eq('id_propriedade', id_propriedade)
      .order('dt_evento', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);
  }

  /**
   * Conta total de registros.
   *
   * @param includeDeleted Se deve incluir registros deletados
   * @returns Total de registros
   */
  async count(includeDeleted: boolean = false) {
    let query = this.supabase.getAdminClient().from(this.tableName).select('*', { count: 'exact', head: true });

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    return query;
  }

  /**
   * Conta registros por propriedade.
   *
   * @param id_propriedade ID da propriedade
   * @returns Total de registros da propriedade
   */
  async countByPropriedade(id_propriedade: string) {
    return this.supabase.getAdminClient().from(this.tableName).select('*', { count: 'exact', head: true }).eq('id_propriedade', id_propriedade);
  }

  /**
   * Cria nova cobertura.
   */
  async create(data: any) {
    return this.supabase.getAdminClient().from(this.tableName).insert(data).select().single();
  }

  /**
   * Atualiza cobertura e retorna com joins.
   */
  async update(id_reproducao: string, data: any) {
    // Primeiro atualiza
    const { error: updateError } = await this.supabase.getAdminClient().from(this.tableName).update(data).eq('id_reproducao', id_reproducao);

    if (updateError) {
      return { data: null, error: updateError };
    }

    // Depois busca com joins
    return this.findById(id_reproducao);
  }

  /**
   * Remove cobertura (soft delete).
   */
  async softDelete(id_reproducao: string) {
    return this.supabase
      .getAdminClient()
      .from(this.tableName)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id_reproducao', id_reproducao)
      .select()
      .single();
  }

  /**
   * Restaura cobertura deletada.
   */
  async restore(id_reproducao: string) {
    return this.supabase.getAdminClient().from(this.tableName).update({ deleted_at: null }).eq('id_reproducao', id_reproducao).select().single();
  }

  /**
   * Busca todas coberturas incluindo deletadas (para admin).
   */
  async findAllWithDeleted() {
    return this.getBaseQuery().order('dt_evento', { ascending: false });
  }

  /**
   * Busca cobertura por ID sem joins (query simples).
   */
  async findByIdSimple(id_reproducao: string) {
    return this.supabase.getAdminClient().from(this.tableName).select('*').eq('id_reproducao', id_reproducao).single();
  }
}
