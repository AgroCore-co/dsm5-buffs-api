import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateEstoqueLeiteDto } from './dto/create-estoque-leite.dto';
import { UpdateEstoqueLeiteDto } from './dto/update-estoque-leite.dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { ISoftDelete } from '../../../core/interfaces/soft-delete.interface';

@Injectable()
export class EstoqueLeiteService implements ISoftDelete {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

  private readonly tableName = 'estoqueleite';

  async create(dto: CreateEstoqueLeiteDto) {
    this.logger.log('Iniciando criação de registro de estoque de leite', {
      module: 'EstoqueLeiteService',
      method: 'create',
      usuarioId: dto.id_usuario,
      propriedadeId: dto.id_propriedade,
    });

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .insert({
        ...dto,
        dt_registro: dto.dt_registro || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      this.logger.logError(error, {
        module: 'EstoqueLeiteService',
        method: 'create',
        usuarioId: dto.id_usuario,
      });
      throw new InternalServerErrorException(`Falha ao criar registro de estoque: ${error.message}`);
    }

    this.logger.log('Registro de estoque de leite criado com sucesso', {
      module: 'EstoqueLeiteService',
      method: 'create',
      estoqueId: data.id_estoque,
      usuarioId: dto.id_usuario,
    });
    return formatDateFields(data);
  }

  async findAll(paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    this.logger.log('Iniciando busca de todos os registros de estoque de leite com paginação', {
      module: 'EstoqueLeiteService',
      method: 'findAll',
    });

    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    // Contar total de registros (excluindo deletados)
    const { count, error: countError } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (countError) {
      this.logger.logError(countError, {
        module: 'EstoqueLeiteService',
        method: 'findAll',
      });
      throw new InternalServerErrorException(`Falha ao contar estoque de leite: ${countError.message}`);
    }

    // Buscar registros com paginação (excluindo deletados)
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .is('deleted_at', null)
      .order('dt_registro', { ascending: false })
      .range(offset, offset + limitValue - 1);

    if (error) {
      this.logger.logError(error, {
        module: 'EstoqueLeiteService',
        method: 'findAll',
      });
      throw new InternalServerErrorException(`Falha ao buscar estoque de leite: ${error.message}`);
    }

    this.logger.log(`Busca de registros de estoque concluída - ${data.length} registros encontrados (página ${page})`, {
      module: 'EstoqueLeiteService',
      method: 'findAll',
    });

    const formattedData = formatDateFieldsArray(data);
    return createPaginatedResponse(formattedData, count || 0, page, limitValue);
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    this.logger.log('Iniciando busca de estoque por propriedade', {
      module: 'EstoqueLeiteService',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });

    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    const { count, error: countError } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id_propriedade', id_propriedade);

    if (countError) {
      this.logger.logError(countError, {
        module: 'EstoqueLeiteService',
        method: 'findByPropriedade',
      });
      throw new InternalServerErrorException(`Falha ao contar estoque da propriedade: ${countError.message}`);
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .eq('id_propriedade', id_propriedade)
      .order('dt_registro', { ascending: false })
      .range(offset, offset + limitValue - 1);

    if (error) {
      this.logger.logError(error, {
        module: 'EstoqueLeiteService',
        method: 'findByPropriedade',
      });
      throw new InternalServerErrorException(`Falha ao buscar estoque da propriedade: ${error.message}`);
    }

    this.logger.log(`Busca concluída - ${data.length} registros encontrados (página ${page})`, {
      module: 'EstoqueLeiteService',
      method: 'findByPropriedade',
    });

    const formattedData = formatDateFieldsArray(data);
    return createPaginatedResponse(formattedData, count || 0, page, limitValue);
  }

  async findOne(id_estoque: string) {
    this.logger.log('Iniciando busca de registro de estoque por ID', {
      module: 'EstoqueLeiteService',
      method: 'findOne',
      estoqueId: id_estoque,
    });

    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).select('*').eq('id_estoque', id_estoque).single();

    if (error || !data) {
      this.logger.warn('Registro de estoque não encontrado', {
        module: 'EstoqueLeiteService',
        method: 'findOne',
        estoqueId: id_estoque,
      });
      throw new NotFoundException(`Registro de estoque com ID ${id_estoque} não encontrado.`);
    }

    this.logger.log('Registro de estoque encontrado com sucesso', {
      module: 'EstoqueLeiteService',
      method: 'findOne',
      estoqueId: id_estoque,
    });
    return formatDateFields(data);
  }

  async update(id_estoque: string, dto: UpdateEstoqueLeiteDto) {
    this.logger.log('Iniciando atualização de registro de estoque', {
      module: 'EstoqueLeiteService',
      method: 'update',
      estoqueId: id_estoque,
    });

    await this.findOne(id_estoque);

    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).update(dto).eq('id_estoque', id_estoque).select().single();

    if (error) {
      this.logger.logError(error, {
        module: 'EstoqueLeiteService',
        method: 'update',
        estoqueId: id_estoque,
      });
      throw new InternalServerErrorException(`Falha ao atualizar registro de estoque: ${error.message}`);
    }

    this.logger.log('Registro de estoque atualizado com sucesso', {
      module: 'EstoqueLeiteService',
      method: 'update',
      estoqueId: id_estoque,
    });
    return formatDateFields(data);
  }

  async remove(id_estoque: string) {
    return this.softDelete(id_estoque);
  }

  async softDelete(id: string) {
    this.logger.log('Iniciando remoção de registro de estoque (soft delete)', {
      module: 'EstoqueLeiteService',
      method: 'softDelete',
      estoqueId: id,
    });

    await this.findOne(id);

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id_estoque', id)
      .select()
      .single();

    if (error) {
      this.logger.logError(error, {
        module: 'EstoqueLeiteService',
        method: 'softDelete',
        estoqueId: id,
      });
      throw new InternalServerErrorException(`Falha ao remover registro de estoque: ${error.message}`);
    }

    this.logger.log('Registro de estoque removido com sucesso (soft delete)', {
      module: 'EstoqueLeiteService',
      method: 'softDelete',
      estoqueId: id,
    });

    return {
      message: 'Registro removido com sucesso (soft delete)',
      data: formatDateFields(data),
    };
  }

  async restore(id: string) {
    this.logger.log('Iniciando restauração de registro de estoque', {
      module: 'EstoqueLeiteService',
      method: 'restore',
      estoqueId: id,
    });

    const { data: estoque } = await this.supabase.getAdminClient().from(this.tableName).select('deleted_at').eq('id_estoque', id).single();

    if (!estoque) {
      throw new NotFoundException(`Registro de estoque com ID ${id} não encontrado`);
    }

    if (!estoque.deleted_at) {
      throw new BadRequestException('Este registro não está removido');
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .update({ deleted_at: null })
      .eq('id_estoque', id)
      .select()
      .single();

    if (error) {
      this.logger.logError(error, {
        module: 'EstoqueLeiteService',
        method: 'restore',
        estoqueId: id,
      });
      throw new InternalServerErrorException(`Falha ao restaurar registro de estoque: ${error.message}`);
    }

    this.logger.log('Registro de estoque restaurado com sucesso', {
      module: 'EstoqueLeiteService',
      method: 'restore',
      estoqueId: id,
    });

    return {
      message: 'Registro restaurado com sucesso',
      data: formatDateFields(data),
    };
  }

  async findAllWithDeleted(): Promise<any[]> {
    this.logger.log('Buscando todos os registros de estoque incluindo deletados', {
      module: 'EstoqueLeiteService',
      method: 'findAllWithDeleted',
    });

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .order('deleted_at', { ascending: false, nullsFirst: true })
      .order('dt_registro', { ascending: false });

    if (error) {
      this.logger.logError(error, {
        module: 'EstoqueLeiteService',
        method: 'findAllWithDeleted',
      });
      throw new InternalServerErrorException('Erro ao buscar registros de estoque (incluindo deletados)');
    }

    return formatDateFieldsArray(data || []);
  }
}
