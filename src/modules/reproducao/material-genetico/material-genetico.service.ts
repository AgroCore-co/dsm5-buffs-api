import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateMaterialGeneticoDto } from './dto/create-material-genetico.dto';
import { UpdateMaterialGeneticoDto } from './dto/update-material-genetico.dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { ISoftDelete } from '../../../core/interfaces';

@Injectable()
export class MaterialGeneticoService implements ISoftDelete {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

  private readonly tableName = 'materialgenetico';

  async create(createMaterialGeneticoDto: CreateMaterialGeneticoDto) {
    const module = 'MaterialGeneticoService';
    const method = 'create';
    this.logger.log('Criando novo material genético', { module, method });

    try {
      // IMPORTANTE: Garantir que NÃO enviamos id_material - deixa o banco gerar automaticamente
      const dadosLimpos = {
        id_propriedade: createMaterialGeneticoDto.id_propriedade,
        tipo: createMaterialGeneticoDto.tipo,
        origem: createMaterialGeneticoDto.origem,
        ...(createMaterialGeneticoDto.id_bufalo_origem && { id_bufalo_origem: createMaterialGeneticoDto.id_bufalo_origem }),
        ...(createMaterialGeneticoDto.fornecedor && { fornecedor: createMaterialGeneticoDto.fornecedor }),
        data_coleta: createMaterialGeneticoDto.data_coleta,
      };

      this.logger.debug('Dados preparados para inserção', { module, method, dadosLimpos });

      const { data, error } = await this.supabase
        .getAdminClient()
        .from(this.tableName)
        .insert([dadosLimpos]) // Só os campos necessários, SEM id_material
        .select()
        .single();

      if (error) {
        this.logger.error('Erro ao inserir material genético', error.message, { module, method });
        throw new InternalServerErrorException(`Falha ao criar material genético: ${error.message}`);
      }

      this.logger.log('Material genético criado com sucesso', { module, method, id_material: data.id_material });

      return {
        message: 'Material genético criado com sucesso',
        data: formatDateFields(data),
      };
    } catch (error) {
      this.logger.error('Erro ao criar material genético', error.message, { module, method });
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const module = 'MaterialGeneticoService';
    const method = 'findAll';
    this.logger.log('Buscando todos os materiais genéticos', { module, method });

    try {
      const { page = 1, limit = 10 } = paginationDto;
      const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

      // Contar total de registros
      const { count, error: countError } = await this.supabase
        .getAdminClient()
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      if (countError) {
        this.logger.error('Erro ao contar registros', countError.message, { module, method });
        throw new InternalServerErrorException(`Erro ao contar material genético: ${countError.message}`);
      }

      // Buscar registros com paginação - sem relacionamentos para evitar erros de FK
      const { data, error } = await this.supabase
        .getAdminClient()
        .from(this.tableName)
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limitValue - 1);

      if (error) {
        this.logger.error('Erro ao buscar materiais genéticos', error.message, { module, method });
        throw new InternalServerErrorException(`Erro ao buscar material genético: ${error.message}`);
      }

      this.logger.log('Materiais genéticos encontrados', { module, method, count: data?.length || 0, page });

      const formattedData = formatDateFieldsArray(data || []);
      return createPaginatedResponse(formattedData, count || 0, page, limitValue);
    } catch (error) {
      this.logger.error('Erro ao buscar materiais genéticos', error.message, { module, method });
      throw new InternalServerErrorException(`Erro ao buscar material genético: ${error.message}`);
    }
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const module = 'MaterialGeneticoService';
    const method = 'findByPropriedade';
    this.logger.log('Buscando materiais genéticos por propriedade', { module, method, id_propriedade });

    try {
      const { page = 1, limit = 10 } = paginationDto;
      const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

      const { count, error: countError } = await this.supabase
        .getAdminClient()
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('id_propriedade', id_propriedade)
        .is('deleted_at', null);

      if (countError) {
        this.logger.error('Erro ao contar materiais da propriedade', countError.message, { module, method });
        throw new InternalServerErrorException(`Erro ao contar material genético: ${countError.message}`);
      }

      // Buscar sem relacionamentos para evitar erros de FK
      const { data, error } = await this.supabase
        .getAdminClient()
        .from(this.tableName)
        .select('*')
        .eq('id_propriedade', id_propriedade)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limitValue - 1);

      if (error) {
        this.logger.error('Erro ao buscar por propriedade', error.message, { module, method });
        throw new InternalServerErrorException(`Erro ao buscar material genético: ${error.message}`);
      }

      this.logger.log('Materiais genéticos encontrados na propriedade', { module, method, count: data?.length || 0, page });

      const formattedData = formatDateFieldsArray(data || []);
      return createPaginatedResponse(formattedData, count || 0, page, limitValue);
    } catch (error) {
      this.logger.error('Erro ao buscar por propriedade', error.message, { module, method });
      throw new InternalServerErrorException(`Erro ao buscar material genético: ${error.message}`);
    }
  }

  async findOne(id_material: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .eq('id_material', id_material)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Material genético com ID ${id_material} não encontrado.`);
    }
    return formatDateFields(data);
  }

  async update(id_material: string, dto: UpdateMaterialGeneticoDto) {
    const module = 'MaterialGeneticoService';
    const method = 'update';
    this.logger.log('Atualizando material genético', { module, method, id_material });

    // Verifica se existe
    await this.findOne(id_material);

    try {
      // Remove qualquer id_material que possa ter vindo no dto
      const { id_material: _, ...cleanedDto } = dto as any;

      this.logger.debug('Dados preparados para atualização', { module, method, cleanedDto });

      const { data, error } = await this.supabase
        .getAdminClient()
        .from(this.tableName)
        .update(cleanedDto)
        .eq('id_material', id_material)
        .select()
        .single();

      if (error) {
        this.logger.error('Erro ao atualizar material genético', error.message, { module, method });
        throw new InternalServerErrorException(`Falha ao atualizar material genético: ${error.message}`);
      }

      this.logger.log('Material genético atualizado com sucesso', { module, method, id_material });
      return formatDateFields(data);
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      this.logger.error('Erro inesperado ao atualizar', error.message, { module, method });
      throw new InternalServerErrorException(`Erro interno ao atualizar material genético: ${error.message}`);
    }
  }

  async remove(id_material: string) {
    return this.softDelete(id_material);
  }

  async softDelete(id: string) {
    const module = 'MaterialGeneticoService';
    const method = 'softDelete';
    this.logger.log('Removendo material genético (soft delete)', { module, method, id_material: id });

    await this.findOne(id);

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id_material', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Erro ao remover material genético', error.message, { module, method });
      throw new InternalServerErrorException(`Falha ao remover material genético: ${error.message}`);
    }

    this.logger.log('Material genético removido com sucesso (soft delete)', { module, method, id_material: id });
    return {
      message: 'Material genético removido com sucesso (soft delete)',
      data: formatDateFields(data),
    };
  }

  async restore(id: string) {
    const module = 'MaterialGeneticoService';
    const method = 'restore';
    this.logger.log('Restaurando material genético', { module, method, id_material: id });

    const { data: material } = await this.supabase.getAdminClient().from(this.tableName).select('deleted_at').eq('id_material', id).single();

    if (!material) {
      throw new NotFoundException(`Material genético com ID ${id} não encontrado`);
    }

    if (!material.deleted_at) {
      throw new BadRequestException('Este material genético não está removido');
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .update({ deleted_at: null })
      .eq('id_material', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Erro ao restaurar material genético', error.message, { module, method });
      throw new InternalServerErrorException(`Falha ao restaurar material genético: ${error.message}`);
    }

    this.logger.log('Material genético restaurado com sucesso', { module, method, id_material: id });
    return {
      message: 'Material genético restaurado com sucesso',
      data: formatDateFields(data),
    };
  }

  async findAllWithDeleted(): Promise<any[]> {
    const module = 'MaterialGeneticoService';
    const method = 'findAllWithDeleted';
    this.logger.log('Buscando todos os materiais genéticos incluindo deletados', { module, method });

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .order('deleted_at', { ascending: false, nullsFirst: true })
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Erro ao buscar materiais genéticos (incluindo deletados)', error.message, { module, method });
      throw new InternalServerErrorException('Erro ao buscar materiais genéticos (incluindo deletados)');
    }

    return formatDateFieldsArray(data || []);
  }
}
