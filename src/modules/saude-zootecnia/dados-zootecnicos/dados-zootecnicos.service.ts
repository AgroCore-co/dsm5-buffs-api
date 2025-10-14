import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateDadoZootecnicoDto } from './dto/create-dado-zootecnico.dto';
import { UpdateDadoZootecnicoDto } from './dto/update-dado-zootecnico.dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';

@Injectable()
export class DadosZootecnicosService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'dadoszootecnicos';

  /**
   * Função auxiliar CORRIGIDA.
   * Busca o 'id_usuario' (bigint) na tabela 'Usuario' (singular)
   * usando a coluna 'auth_id' (uuid).
   */
  private async getInternalUserId(authUuid: string): Promise<number> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('usuario')
      .select('id_usuario') // <-- COLUNA CORRETA (O bigint PK que queremos)
      .eq('auth_id', authUuid) // <-- COLUNA CORRETA (Confirmada por você)
      .single();

    if (error || !data) {
      // Este erro agora só deve ocorrer se o usuário logado (auth_id)
      // realmente não tiver um registro correspondente na tabela 'Usuario'.
      throw new UnauthorizedException(
        `Falha na sincronização do usuário. O usuário (auth: ${authUuid}) não foi encontrado no registro local 'Usuario'.`,
      );
    }

    return data.id_usuario;
  }

  /**
   * O parâmetro final 'auth_uuid' é o 'sub' (string UUID) vindo do controller.
   */
  async create(dto: CreateDadoZootecnicoDto, id_bufalo: string, auth_uuid: string) {
    // 1. TRADUZIR: Buscar o ID numérico (bigint) usando o Auth UUID (string)
    const internalUserId = await this.getInternalUserId(auth_uuid);

    // 2. INSERIR: Agora usamos o ID numérico correto (internalUserId) no insert
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .insert({
        ...dto,
        id_bufalo: id_bufalo,
        id_usuario: internalUserId, // <-- Inserindo o BIGINT correto
        dt_registro: dto.dt_registro || new Date(),
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao criar dado zootécnico: ${error.message}`);
    }
    return data;
  }

  async findAllByBufalo(id_bufalo: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    // Contar total de registros para este búfalo
    const { count, error: countError } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id_bufalo', id_bufalo);

    if (countError) {
      throw new InternalServerErrorException(`Falha ao contar dados do búfalo: ${countError.message}`);
    }

    // Buscar registros com paginação
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .eq('id_bufalo', id_bufalo)
      .order('dt_registro', { ascending: false })
      .range(offset, offset + limitValue - 1);

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar dados do búfalo: ${error.message}`);
    }

    return createPaginatedResponse(data, count || 0, page, limitValue);
  }

  async findAllByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    // Primeiro, busca o total de registros para a propriedade (através do JOIN com búfalos)
    const { count, error: countError } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('id_zootec, bufalo!inner(id_propriedade)', { count: 'exact', head: true })
      .eq('bufalo.id_propriedade', id_propriedade);

    if (countError) {
      throw new InternalServerErrorException(`Falha ao contar dados zootécnicos da propriedade: ${countError.message}`);
    }

    // Buscar registros com informações do búfalo
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select(
        `
        *,
        bufalo:id_bufalo(id_bufalo, nome, brinco, id_propriedade)
      `,
      )
      .eq('bufalo.id_propriedade', id_propriedade)
      .order('dt_registro', { ascending: false })
      .range(offset, offset + limitValue - 1);

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar dados zootécnicos da propriedade: ${error.message}`);
    }

    return createPaginatedResponse(data, count || 0, page, limitValue);
  }

  async findOne(id_zootec: string) {
    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).select('*').eq('id_zootec', id_zootec).single();

    if (error || !data) {
      throw new NotFoundException(`Dado zootécnico com ID ${id_zootec} não encontrado.`);
    }
    return data;
  }

  async update(id_zootec: string, dto: UpdateDadoZootecnicoDto) {
    await this.findOne(id_zootec); // Garante que o registro existe

    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).update(dto).eq('id_zootec', id_zootec).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar dado zootécnico: ${error.message}`);
    }
    return data;
  }

  async remove(id_zootec: string) {
    await this.findOne(id_zootec); // Garante que o registro existe

    const { error } = await this.supabase.getAdminClient().from(this.tableName).delete().eq('id_zootec', id_zootec);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover dado zootécnico: ${error.message}`);
    }
    return { message: 'Registro removido com sucesso' };
  }
}
