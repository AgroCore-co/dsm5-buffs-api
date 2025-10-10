import { Injectable, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateMaterialGeneticoDto } from './dto/create-material-genetico.dto';
import { UpdateMaterialGeneticoDto } from './dto/update-material-genetico.dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';

@Injectable()
export class MaterialGeneticoService {
  private readonly logger = new Logger(MaterialGeneticoService.name);

  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'materialgenetico';

  async create(createMaterialGeneticoDto: CreateMaterialGeneticoDto) {
    this.logger.log('[INICIO] Criando novo material genético');

    try {
      // IMPORTANTE: Garantir que NÃO enviamos id_material - deixa o banco gerar automaticamente
      const dadosLimpos = {
        tipo: createMaterialGeneticoDto.tipo,
        origem: createMaterialGeneticoDto.origem,
        ...(createMaterialGeneticoDto.id_bufalo_origem && { id_bufalo_origem: createMaterialGeneticoDto.id_bufalo_origem }),
        ...(createMaterialGeneticoDto.fornecedor && { fornecedor: createMaterialGeneticoDto.fornecedor }),
        data_coleta: createMaterialGeneticoDto.data_coleta,
      };

      this.logger.debug(`[DADOS_LIMPOS] Inserindo: ${JSON.stringify(dadosLimpos)}`);

      const { data, error } = await this.supabase
        .getAdminClient()
        .from(this.tableName)
        .insert([dadosLimpos]) // Só os campos necessários, SEM id_material
        .select()
        .single();

      if (error) {
        this.logger.error(`[ERRO_INSERCAO] ${error.message}`);
        throw new InternalServerErrorException(`Falha ao criar material genético: ${error.message}`);
      }

      this.logger.log(`[SUCESSO] Material genético criado com ID: ${data.id_material}`);

      return {
        message: 'Material genético criado com sucesso',
        data,
      };
    } catch (error) {
      this.logger.error(`[ERRO_GERAL] ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    this.logger.log('[INICIO] Buscando todos os materiais genéticos com paginação');

    try {
      const { page = 1, limit = 10 } = paginationDto;
      const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

      // Contar total de registros
      const { count, error: countError } = await this.supabase.getAdminClient().from(this.tableName).select('*', { count: 'exact', head: true });

      if (countError) {
        this.logger.error(`[ERRO] Falha ao contar: ${countError.message}`);
        throw new InternalServerErrorException(`Erro ao contar material genético: ${countError.message}`);
      }

      // Buscar registros com paginação
      const { data, error } = await this.supabase
        .getAdminClient()
        .from(this.tableName)
        .select(
          `
          *,
          raca:id_raca(
            id_raca,
            nome_raca
          )
        `,
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + limitValue - 1);

      if (error) {
        this.logger.error(`[ERRO] Falha na consulta: ${error.message}`);
        throw new InternalServerErrorException(`Erro ao buscar material genético: ${error.message}`);
      }

      this.logger.log(`[SUCESSO] ${data?.length || 0} materiais genéticos encontrados (página ${page})`);

      return createPaginatedResponse(data || [], count || 0, page, limitValue);
    } catch (error) {
      this.logger.error(`[ERRO_GERAL] ${error.message}`);
      throw new InternalServerErrorException(`Erro ao buscar material genético: ${error.message}`);
    }
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    this.logger.log('[INICIO] Buscando materiais genéticos por propriedade com paginação');

    try {
      const { page = 1, limit = 10 } = paginationDto;
      const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

      const { count, error: countError } = await this.supabase
        .getAdminClient()
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('id_propriedade', id_propriedade);

      if (countError) {
        this.logger.error(`[ERRO] Falha ao contar materiais da propriedade: ${countError.message}`);
        throw new InternalServerErrorException(`Erro ao contar material genético: ${countError.message}`);
      }

      const { data, error } = await this.supabase
        .getAdminClient()
        .from(this.tableName)
        .select(
          `
          *,
          raca:id_raca(
            id_raca,
            nome_raca
          ),
          propriedade:Propriedade(nome)
        `,
        )
        .eq('id_propriedade', id_propriedade)
        .order('created_at', { ascending: false })
        .range(offset, offset + limitValue - 1);

      if (error) {
        this.logger.error(`[ERRO] Falha na consulta por propriedade: ${error.message}`);
        throw new InternalServerErrorException(`Erro ao buscar material genético: ${error.message}`);
      }

      this.logger.log(`[SUCESSO] ${data?.length || 0} materiais genéticos encontrados na propriedade (página ${page})`);

      return createPaginatedResponse(data || [], count || 0, page, limitValue);
    } catch (error) {
      this.logger.error(`[ERRO_GERAL] ${error.message}`);
      throw new InternalServerErrorException(`Erro ao buscar material genético: ${error.message}`);
    }
  }

  async findOne(id_material: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*, bufalo_origem:Bufalo(id_bufalo, nome, brinco)')
      .eq('id_material', id_material)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Material genético com ID ${id_material} não encontrado.`);
    }
    return data;
  }

  async update(id_material: string, dto: UpdateMaterialGeneticoDto) {
    this.logger.log(`[INICIO] Atualizando material genético ID: ${id_material}`);
    this.logger.debug(`[UPDATE] Dados recebidos: ${JSON.stringify(dto)}`);

    // Verifica se existe
    await this.findOne(id_material);

    try {
      // Remove qualquer id_material que possa ter vindo no dto
      const { id_material: _, ...cleanedDto } = dto as any;

      this.logger.debug(`[UPDATE] Dados limpos para atualização: ${JSON.stringify(cleanedDto)}`);

      const { data, error } = await this.supabase
        .getAdminClient()
        .from(this.tableName)
        .update(cleanedDto)
        .eq('id_material', id_material)
        .select()
        .single();

      if (error) {
        this.logger.error(`[ERRO] Falha na atualização: ${error.message}`);
        throw new InternalServerErrorException(`Falha ao atualizar material genético: ${error.message}`);
      }

      this.logger.log(`[SUCESSO] Material genético ID: ${id_material} atualizado`);
      return data;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      this.logger.error(`[ERRO] Erro inesperado na atualização: ${error.message}`);
      throw new InternalServerErrorException(`Erro interno ao atualizar material genético: ${error.message}`);
    }
  }

  async remove(id_material: string) {
    this.logger.log(`[INICIO] Removendo material genético ID: ${id_material}`);

    // Verifica se existe
    await this.findOne(id_material);

    try {
      const { error } = await this.supabase.getAdminClient().from(this.tableName).delete().eq('id_material', id_material);

      if (error) {
        this.logger.error(`[ERRO] Falha na remoção: ${error.message}`);
        throw new InternalServerErrorException(`Falha ao remover material genético: ${error.message}`);
      }

      this.logger.log(`[SUCESSO] Material genético ID: ${id_material} removido`);
      return { message: 'Registro removido com sucesso' };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      this.logger.error(`[ERRO] Erro inesperado na remoção: ${error.message}`);
      throw new InternalServerErrorException(`Erro interno ao remover material genético: ${error.message}`);
    }
  }
}
