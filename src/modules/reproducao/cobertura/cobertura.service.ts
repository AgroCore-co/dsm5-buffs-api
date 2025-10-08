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

  private readonly tableName = 'DadosReproducao';

  async create(dto: CreateCoberturaDto) {
    const dtoComStatus = {
      ...dto,
      status: dto.status || 'Em andamento', // Garante um status inicial
    };

    const { data, error } = await this.supabase.getClient().from(this.tableName).insert(dtoComStatus).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao criar dado de reprodução: ${error.message}`);
    }
    return data;
  }

  async findAll(paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    // Contar total de registros
    const { count, error: countError } = await this.supabase.getClient().from(this.tableName).select('*', { count: 'exact', head: true });

    if (countError) {
      throw new InternalServerErrorException(`Falha ao contar dados de reprodução: ${countError.message}`);
    }

    // Buscar registros com paginação
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*')
      .order('dt_evento', { ascending: false })
      .range(offset, offset + limitValue - 1);

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar dados de reprodução: ${error.message}`);
    }

    return createPaginatedResponse(data, count || 0, page, limitValue);
  }

  async findOne(id_repro: string) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').eq('id_repro', id_repro).single();

    if (error || !data) {
      throw new NotFoundException(`Dado de reprodução com ID ${id_repro} não encontrado.`);
    }
    return data;
  }

  async update(id_repro: string, dto: UpdateCoberturaDto) {
    await this.findOne(id_repro);

    const { data, error } = await this.supabase.getClient().from(this.tableName).update(dto).eq('id_repro', id_repro).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar dado de reprodução: ${error.message}`);
    }
    return data;
  }

  async remove(id_repro: string) {
    await this.findOne(id_repro);

    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_repro', id_repro);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover dado de reprodução: ${error.message}`);
    }
    return { message: 'Registro removido com sucesso' };
  }
}
