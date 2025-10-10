import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateCoberturaDto } from './dto/create-cobertura.dto';
import { UpdateCoberturaDto } from './dto/update-cobertura.dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';

@Injectable()
export class CoberturaService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'dadosreproducao';

  private async getInternalUserId(authUuid: string): Promise<number> {
    const { data, error } = await this.supabase.getAdminClient().from('usuario').select('id_usuario').eq('auth_id', authUuid).single();

    if (error || !data) {
      throw new InternalServerErrorException(
        `Falha na sincronização do usuário. O usuário (auth: ${authUuid}) não foi encontrado no registro local 'Usuario'.`,
      );
    }

    return data.id_usuario;
  }

  async create(dto: CreateCoberturaDto, auth_uuid: string) {
    const internalUserId = await this.getInternalUserId(auth_uuid);

    const dtoComStatus = {
      ...dto,
      status: dto.status || 'Em andamento',
      id_usuario: internalUserId,
    };

    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).insert(dtoComStatus).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao criar dado de reprodução: ${error.message}`);
    }
    return data;
  }

  async findAll(paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    // Contar total de registros
    const { count, error: countError } = await this.supabase.getAdminClient().from(this.tableName).select('*', { count: 'exact', head: true });

    if (countError) {
      throw new InternalServerErrorException(`Falha ao contar dados de reprodução: ${countError.message}`);
    }

    // Buscar registros com paginação
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .order('dt_evento', { ascending: false })
      .range(offset, offset + limitValue - 1);

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar dados de reprodução: ${error.message}`);
    }

    return createPaginatedResponse(data, count || 0, page, limitValue);
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    const { count, error: countError } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id_propriedade', id_propriedade);

    if (countError) {
      throw new InternalServerErrorException(`Falha ao contar dados de reprodução da propriedade: ${countError.message}`);
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*, propriedade:Propriedade(nome), receptora:Bufalo!id_receptora(nome, brinco)')
      .eq('id_propriedade', id_propriedade)
      .order('dt_evento', { ascending: false })
      .range(offset, offset + limitValue - 1);

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar dados de reprodução da propriedade: ${error.message}`);
    }

    return createPaginatedResponse(data, count || 0, page, limitValue);
  }

  async findOne(id_repro: string) {
    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).select('*').eq('id_repro', id_repro).single();

    if (error || !data) {
      throw new NotFoundException(`Dado de reprodução com ID ${id_repro} não encontrado.`);
    }
    return data;
  }

  async update(id_repro: string, dto: UpdateCoberturaDto) {
    await this.findOne(id_repro);

    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).update(dto).eq('id_repro', id_repro).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar dado de reprodução: ${error.message}`);
    }
    return data;
  }

  async remove(id_repro: string) {
    await this.findOne(id_repro);

    const { error } = await this.supabase.getAdminClient().from(this.tableName).delete().eq('id_repro', id_repro);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover dado de reprodução: ${error.message}`);
    }
    return { message: 'Registro removido com sucesso' };
  }
}
