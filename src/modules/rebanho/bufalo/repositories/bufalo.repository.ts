import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/core/supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Repository para queries de búfalos.
 * Isola acesso ao banco de dados da lógica de negócio.
 *
 * **Responsabilidades:**
 * - Executar queries no Supabase
 * - Retornar dados brutos (sem processamento)
 * - Não contém lógica de negócio
 */
@Injectable()
export class BufaloRepository {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getAdminClient();
  }

  /**
   * Query base para búfalos com joins (raça, grupo, propriedade).
   * Todas as outras queries usam esta como base.
   */
  private getBaseQuery() {
    return this.supabase.from('bufalo').select(`
      *,
      raca:id_raca(nome),
      grupo:id_grupo(nome_grupo),
      propriedade:id_propriedade(nome)
    `);
  }

  /**
   * Busca búfalo completo por ID com todos os relacionamentos.
   */
  async findById(id_bufalo: string) {
    return await this.getBaseQuery().eq('id_bufalo', id_bufalo).single();
  }

  /**
   * Busca búfalos com filtros dinâmicos e paginação.
   *
   * @param filtros Objeto com filtros opcionais (id_propriedade, id_raca, sexo, etc.)
   * @param pagination Paginação (offset, limit)
   * @param orderBy Ordenação (campo e direção)
   * @returns Búfalos filtrados
   */
  async findWithFilters(
    filtros: {
      id_propriedade?: string | string[];
      id_raca?: string;
      sexo?: string;
      nivel_maturidade?: string;
      status?: boolean;
      brinco?: string;
      id_grupo?: string;
      microchip?: string;
      nome?: string;
    },
    pagination: { offset: number; limit: number },
    orderBy: Array<{ field: string; ascending: boolean }> = [
      { field: 'status', ascending: false },
      { field: 'dt_nascimento', ascending: true },
    ],
  ) {
    let query = this.getBaseQuery();

    // Aplica filtros dinamicamente
    if (filtros.id_propriedade) {
      if (Array.isArray(filtros.id_propriedade)) {
        query = query.in('id_propriedade', filtros.id_propriedade);
      } else {
        query = query.eq('id_propriedade', filtros.id_propriedade);
      }
    }

    if (filtros.id_raca) {
      query = query.eq('id_raca', filtros.id_raca);
    }

    if (filtros.sexo) {
      query = query.eq('sexo', filtros.sexo);
    }

    if (filtros.nivel_maturidade) {
      query = query.eq('nivel_maturidade', filtros.nivel_maturidade);
    }

    if (filtros.status !== undefined) {
      query = query.eq('status', filtros.status);
    }

    if (filtros.brinco) {
      // Busca progressiva: "IZ" encontra "IZ-001", "IZ-002" mas não "BUF-IZ-001"
      query = query.ilike('brinco', `${filtros.brinco}%`);
    }

    if (filtros.id_grupo) {
      query = query.eq('id_grupo', filtros.id_grupo);
    }

    if (filtros.microchip) {
      query = query.eq('microchip', filtros.microchip);
    }

    if (filtros.nome) {
      query = query.ilike('nome', `%${filtros.nome}%`);
    }

    // Aplica ordenação
    for (const order of orderBy) {
      query = query.order(order.field, { ascending: order.ascending });
    }

    // Aplica paginação
    query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);

    return await query;
  }

  /**
   * Conta búfalos com filtros (para paginação).
   */
  async countWithFilters(filtros: {
    id_propriedade?: string | string[];
    id_raca?: string;
    sexo?: string;
    nivel_maturidade?: string;
    status?: boolean;
    brinco?: string;
    id_grupo?: string;
    microchip?: string;
    nome?: string;
  }) {
    let query = this.supabase.from('bufalo').select('*', { count: 'exact', head: true });

    // Aplica os mesmos filtros
    if (filtros.id_propriedade) {
      if (Array.isArray(filtros.id_propriedade)) {
        query = query.in('id_propriedade', filtros.id_propriedade);
      } else {
        query = query.eq('id_propriedade', filtros.id_propriedade);
      }
    }

    if (filtros.id_raca) query = query.eq('id_raca', filtros.id_raca);
    if (filtros.sexo) query = query.eq('sexo', filtros.sexo);
    if (filtros.nivel_maturidade) query = query.eq('nivel_maturidade', filtros.nivel_maturidade);
    if (filtros.status !== undefined) query = query.eq('status', filtros.status);
    // Busca progressiva: "IZ" encontra "IZ-001", "IZ-002" mas não "BUF-IZ-001"
    if (filtros.brinco) query = query.ilike('brinco', `${filtros.brinco}%`);
    if (filtros.id_grupo) query = query.eq('id_grupo', filtros.id_grupo);
    if (filtros.microchip) query = query.eq('microchip', filtros.microchip);
    if (filtros.nome) query = query.ilike('nome', `%${filtros.nome}%`);

    return await query;
  }

  /**
   * Busca búfalo por microchip em propriedades específicas.
   */
  async findByMicrochip(microchip: string, id_propriedades: string[]) {
    return await this.getBaseQuery().eq('microchip', microchip).in('id_propriedade', id_propriedades).single();
  }

  /**
   * Busca búfalos ativos (status = true) de uma lista de IDs.
   */
  async findActiveByIds(ids: string[]) {
    return await this.getBaseQuery().in('id_bufalo', ids).eq('status', true);
  }

  /**
   * Atualiza búfalo por ID.
   */
  async update(id_bufalo: string, data: any) {
    return await this.supabase.from('bufalo').update(data).eq('id_bufalo', id_bufalo).select().single();
  }

  /**
   * Atualiza múltiplos búfalos (para grupo, maturidade, etc).
   */
  async updateMany(ids: string[], data: any) {
    return await this.supabase.from('bufalo').update(data).in('id_bufalo', ids).select();
  }

  /**
   * Cria novo búfalo.
   */
  async create(data: any) {
    return await this.supabase.from('bufalo').insert(data).select().single();
  }

  /**
   * Remove búfalo por ID (soft delete).
   */
  async delete(id_bufalo: string) {
    return await this.supabase.from('bufalo').delete().eq('id_bufalo', id_bufalo);
  }

  /**
   * Verifica se búfalo tem descendentes (filhos).
   */
  async hasOffspring(id_bufalo: string): Promise<boolean> {
    const { data, error } = await this.supabase.from('bufalo').select('id_bufalo').or(`id_pai.eq.${id_bufalo},id_mae.eq.${id_bufalo}`).limit(1);

    return !error && data && data.length > 0;
  }

  /**
   * Busca búfalos por ID do pai.
   */
  async findByPai(id_pai: string) {
    return await this.getBaseQuery().eq('id_pai', id_pai);
  }

  /**
   * Busca búfalos por ID da mãe.
   */
  async findByMae(id_mae: string) {
    return await this.getBaseQuery().eq('id_mae', id_mae);
  }

  /**
   * Busca IDs de propriedades onde usuário é dono ou funcionário.
   */
  async findPropriedadesByUserId(userId: string): Promise<string[]> {
    // Propriedades onde é dono
    const { data: asOwner } = await this.supabase.from('propriedade').select('id_propriedade').eq('id_usuario', userId);

    // Propriedades onde é funcionário
    const { data: asEmployee } = await this.supabase.from('funcionario').select('id_propriedade').eq('id_funcionario', userId);

    const ownerIds = asOwner?.map((p) => p.id_propriedade) || [];
    const employeeIds = asEmployee?.map((p) => p.id_propriedade) || [];

    // Remove duplicatas
    return [...new Set([...ownerIds, ...employeeIds])];
  }

  /**
   * Verifica se usuário tem acesso a uma propriedade específica.
   */
  async userHasAccessToPropriedade(userId: string, id_propriedade: string): Promise<boolean> {
    const propriedades = await this.findPropriedadesByUserId(userId);
    return propriedades.includes(id_propriedade);
  }

  /**
   * Verifica se usuário tem acesso a um búfalo específico.
   */
  async userHasAccessToBufalo(userId: string, id_bufalo: string): Promise<boolean> {
    const { data } = await this.supabase.from('bufalo').select('id_propriedade').eq('id_bufalo', id_bufalo).single();

    if (!data?.id_propriedade) return false;

    return await this.userHasAccessToPropriedade(userId, data.id_propriedade);
  }
}
