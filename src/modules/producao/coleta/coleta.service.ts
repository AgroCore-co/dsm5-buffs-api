import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { CreateColetaDto } from './dto/create-coleta.dto';
import { UpdateColetaDto } from './dto/update-coleta.dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';

@Injectable()
export class ColetaService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

  private readonly tableName = 'coleta';

  async create(dto: CreateColetaDto, id_funcionario: string) {
    this.logger.log('Iniciando criação de coleta', {
      module: 'ColetaService',
      method: 'create',
      funcionarioId: id_funcionario,
      industriaId: dto.id_industria,
    });

    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).insert(dto).select().single();

    if (error) {
      this.logger.logError(error, {
        module: 'ColetaService',
        method: 'create',
        funcionarioId: id_funcionario,
      });
      throw new InternalServerErrorException(`Falha ao criar coleta: ${error.message}`);
    }

    this.logger.log('Coleta criada com sucesso', {
      module: 'ColetaService',
      method: 'create',
      coletaId: data.id_coleta,
      funcionarioId: id_funcionario,
    });
    return formatDateFields(data);
  }

  async findAll(paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    this.logger.log('Iniciando busca de todas as coletas com paginação', {
      module: 'ColetaService',
      method: 'findAll',
    });

    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    // Contar total de registros
    const { count, error: countError } = await this.supabase.getAdminClient().from(this.tableName).select('*', { count: 'exact', head: true });

    if (countError) {
      this.logger.logError(countError, {
        module: 'ColetaService',
        method: 'findAll',
      });
      throw new InternalServerErrorException(`Falha ao contar coletas: ${countError.message}`);
    }

    // Buscar registros com paginação
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .order('dt_coleta', { ascending: false })
      .range(offset, offset + limitValue - 1);

    if (error) {
      this.logger.logError(error, {
        module: 'ColetaService',
        method: 'findAll',
      });
      throw new InternalServerErrorException(`Falha ao buscar coletas: ${error.message}`);
    }

    this.logger.log(`Busca de coletas concluída - ${data.length} coletas encontradas (página ${page})`, {
      module: 'ColetaService',
      method: 'findAll',
    });

    const formattedData = formatDateFieldsArray(data);
    return createPaginatedResponse(formattedData, count || 0, page, limitValue);
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}): Promise<any> {
    this.logger.log('Iniciando busca de coletas por propriedade', {
      module: 'ColetaService',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });

    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    // Contar total de coletas da propriedade
    const { count, error: countError } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id_propriedade', id_propriedade);

    if (countError) {
      this.logger.logError(countError, {
        module: 'ColetaService',
        method: 'findByPropriedade',
      });
      throw new InternalServerErrorException(`Falha ao contar coletas da propriedade: ${countError.message}`);
    }

    // Buscar coletas com join na tabela de indústria
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*, industria:id_industria(nome)')
      .eq('id_propriedade', id_propriedade)
      .order('dt_coleta', { ascending: false })
      .range(offset, offset + limitValue - 1);

    if (error) {
      this.logger.logError(error, {
        module: 'ColetaService',
        method: 'findByPropriedade',
      });
      throw new InternalServerErrorException(`Falha ao buscar coletas da propriedade: ${error.message}`);
    }

    // Contar coletas aprovadas e rejeitadas de TODA a propriedade
    const { data: allColetasStats, error: statsError } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('resultado_teste', { count: 'exact', head: false })
      .eq('id_propriedade', id_propriedade);

    if (statsError) {
      this.logger.logError(statsError, {
        module: 'ColetaService',
        method: 'findByPropriedade',
      });
      throw new InternalServerErrorException(`Falha ao buscar estatísticas de coletas: ${statsError.message}`);
    }

    const totalAprovadas = (allColetasStats || []).filter((c: any) => c.resultado_teste === true).length;
    const totalRejeitadas = (allColetasStats || []).filter((c: any) => c.resultado_teste === false).length;

    // Transformar dados para incluir nome_empresa
    const dataTransformed = (data || []).map((coleta: any) => ({
      ...coleta,
      nome_empresa: coleta.industria?.nome || 'Indústria não identificada',
      industria: undefined, // Remover o objeto industria da resposta
    }));

    // Montar resposta com meta enriquecido
    const totalPages = Math.ceil((count || 0) / limitValue);
    const response = {
      data: dataTransformed,
      meta: {
        page,
        limit: limitValue,
        total: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        totalAprovadas,
        totalRejeitadas,
      },
    };

    this.logger.log(`Busca concluída - ${data.length} coletas encontradas (página ${page})`, {
      module: 'ColetaService',
      method: 'findByPropriedade',
      totalAprovadas,
      totalRejeitadas,
    });

    return response;
  }

  async findOne(id_coleta: string) {
    this.logger.log('Iniciando busca de coleta por ID', {
      module: 'ColetaService',
      method: 'findOne',
      coletaId: id_coleta,
    });

    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).select('*').eq('id_coleta', id_coleta).single();

    if (error || !data) {
      this.logger.warn('Coleta não encontrada', {
        module: 'ColetaService',
        method: 'findOne',
        coletaId: id_coleta,
      });
      throw new NotFoundException(`Coleta com ID ${id_coleta} não encontrada.`);
    }

    this.logger.log('Coleta encontrada com sucesso', {
      module: 'ColetaService',
      method: 'findOne',
      coletaId: id_coleta,
    });
    return formatDateFields(data);
  }

  async update(id_coleta: string, dto: UpdateColetaDto) {
    this.logger.log('Iniciando atualização de coleta', {
      module: 'ColetaService',
      method: 'update',
      coletaId: id_coleta,
    });

    await this.findOne(id_coleta);

    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).update(dto).eq('id_coleta', id_coleta).select().single();

    if (error) {
      this.logger.logError(error, {
        module: 'ColetaService',
        method: 'update',
        coletaId: id_coleta,
      });
      throw new InternalServerErrorException(`Falha ao atualizar coleta: ${error.message}`);
    }

    this.logger.log('Coleta atualizada com sucesso', {
      module: 'ColetaService',
      method: 'update',
      coletaId: id_coleta,
    });
    return formatDateFields(data);
  }

  async remove(id_coleta: string) {
    this.logger.log('Iniciando remoção de coleta', {
      module: 'ColetaService',
      method: 'remove',
      coletaId: id_coleta,
    });

    await this.findOne(id_coleta);

    const { error } = await this.supabase.getAdminClient().from(this.tableName).delete().eq('id_coleta', id_coleta);

    if (error) {
      this.logger.logError(error, {
        module: 'ColetaService',
        method: 'remove',
        coletaId: id_coleta,
      });
      throw new InternalServerErrorException(`Falha ao remover coleta: ${error.message}`);
    }

    this.logger.log('Coleta removida com sucesso', {
      module: 'ColetaService',
      method: 'remove',
      coletaId: id_coleta,
    });
    return { message: 'Coleta removida com sucesso' };
  }
}
