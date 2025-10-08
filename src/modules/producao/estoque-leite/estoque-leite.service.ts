import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateEstoqueLeiteDto } from './dto/create-estoque-leite.dto';
import { UpdateEstoqueLeiteDto } from './dto/update-estoque-leite.dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';

@Injectable()
export class EstoqueLeiteService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

  private readonly tableName = 'estoqueleite';

  async create(dto: CreateEstoqueLeiteDto, id_usuario: string) {
    this.logger.log('Iniciando criação de registro de estoque de leite', {
      module: 'EstoqueLeiteService',
      method: 'create',
      usuarioId: id_usuario,
      propriedadeId: dto.id_propriedade,
    });

    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .insert({
        ...dto,
        id_usuario: id_usuario,
        dt_registro: dto.dt_registro || new Date(),
      })
      .select()
      .single();

    if (error) {
      this.logger.logError(error, {
        module: 'EstoqueLeiteService',
        method: 'create',
        usuarioId: id_usuario,
      });
      throw new InternalServerErrorException(`Falha ao criar registro de estoque: ${error.message}`);
    }

    this.logger.log('Registro de estoque de leite criado com sucesso', {
      module: 'EstoqueLeiteService',
      method: 'create',
      estoqueId: data.id_estoque,
      usuarioId: id_usuario,
    });
    return data;
  }

  async findAll(paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    this.logger.log('Iniciando busca de todos os registros de estoque de leite com paginação', {
      module: 'EstoqueLeiteService',
      method: 'findAll',
    });

    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    // Contar total de registros
    const { count, error: countError } = await this.supabase.getClient().from(this.tableName).select('*', { count: 'exact', head: true });

    if (countError) {
      this.logger.logError(countError, {
        module: 'EstoqueLeiteService',
        method: 'findAll',
      });
      throw new InternalServerErrorException(`Falha ao contar estoque de leite: ${countError.message}`);
    }

    // Buscar registros com paginação
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*, propriedade:Propriedade(nome), usuario:Usuario(nome)')
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

    return createPaginatedResponse(data, count || 0, page, limitValue);
  }

  async findOne(id_estoque: string) {
    this.logger.log('Iniciando busca de registro de estoque por ID', {
      module: 'EstoqueLeiteService',
      method: 'findOne',
      estoqueId: id_estoque,
    });

    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*, propriedade:Propriedade(nome), usuario:Usuario(nome)')
      .eq('id_estoque', id_estoque)
      .single();

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
    return data;
  }

  async update(id_estoque: string, dto: UpdateEstoqueLeiteDto) {
    this.logger.log('Iniciando atualização de registro de estoque', {
      module: 'EstoqueLeiteService',
      method: 'update',
      estoqueId: id_estoque,
    });

    await this.findOne(id_estoque);

    const { data, error } = await this.supabase.getClient().from(this.tableName).update(dto).eq('id_estoque', id_estoque).select().single();

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
    return data;
  }

  async remove(id_estoque: string) {
    this.logger.log('Iniciando remoção de registro de estoque', {
      module: 'EstoqueLeiteService',
      method: 'remove',
      estoqueId: id_estoque,
    });

    await this.findOne(id_estoque);

    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_estoque', id_estoque);

    if (error) {
      this.logger.logError(error, {
        module: 'EstoqueLeiteService',
        method: 'remove',
        estoqueId: id_estoque,
      });
      throw new InternalServerErrorException(`Falha ao remover registro de estoque: ${error.message}`);
    }

    this.logger.log('Registro de estoque removido com sucesso', {
      module: 'EstoqueLeiteService',
      method: 'remove',
      estoqueId: id_estoque,
    });
    return { message: 'Registro removido com sucesso' };
  }
}
