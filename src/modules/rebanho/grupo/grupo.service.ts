import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { ISoftDelete } from '../../../core/interfaces';

@Injectable()
export class GrupoService implements ISoftDelete {
  private supabase: SupabaseClient;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly logger: LoggerService,
  ) {
    this.supabase = this.supabaseService.getAdminClient();
  }

  async create(createGrupoDto: CreateGrupoDto) {
    this.logger.log('Iniciando criação de grupo', { module: 'GrupoService', method: 'create' });

    const { data, error } = await this.supabase.from('grupo').insert(createGrupoDto).select().single();

    if (error) {
      this.logger.logError(error, { module: 'GrupoService', method: 'create' });
      throw new InternalServerErrorException('Falha ao criar o grupo.');
    }

    this.logger.log('Grupo criado com sucesso', { module: 'GrupoService', method: 'create', grupoId: data.id_grupo });
    return formatDateFields(data);
  }

  async findAll() {
    this.logger.log('Iniciando busca de todos os grupos', { module: 'GrupoService', method: 'findAll' });

    const { data, error } = await this.supabase.from('grupo').select('*').is('deleted_at', null).order('nome_grupo', { ascending: true });

    if (error) {
      this.logger.logError(error, { module: 'GrupoService', method: 'findAll' });
      throw new InternalServerErrorException('Falha ao buscar os grupos.');
    }

    this.logger.log(`Busca de grupos concluída - ${data.length} grupos encontrados`, { module: 'GrupoService', method: 'findAll' });
    return formatDateFieldsArray(data);
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    this.logger.log('Iniciando busca de grupos por propriedade', {
      module: 'GrupoService',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });

    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    const { count, error: countError } = await this.supabase
      .from('grupo')
      .select('*', { count: 'exact', head: true })
      .eq('id_propriedade', id_propriedade)
      .is('deleted_at', null);

    if (countError) {
      this.logger.logError(countError, {
        module: 'GrupoService',
        method: 'findByPropriedade',
      });
      throw new InternalServerErrorException(`Falha ao contar grupos da propriedade: ${countError.message}`);
    }

    const { data, error } = await this.supabase
      .from('grupo')
      .select('*, id_propriedade:propriedade!inner(nome)')
      .eq('id_propriedade', id_propriedade)
      .is('deleted_at', null)
      .order('nome_grupo', { ascending: true })
      .range(offset, offset + limitValue - 1);

    if (error) {
      this.logger.logError(error, {
        module: 'GrupoService',
        method: 'findByPropriedade',
      });
      throw new InternalServerErrorException(`Falha ao buscar grupos da propriedade: ${error.message}`);
    }

    this.logger.log(`Busca concluída - ${data.length} grupos encontrados (página ${page})`, {
      module: 'GrupoService',
      method: 'findByPropriedade',
    });

    const formattedData = formatDateFieldsArray(data);
    return createPaginatedResponse(formattedData, count || 0, page, limitValue);
  }

  async findOne(id: string) {
    this.logger.log('Iniciando busca de grupo por ID', { module: 'GrupoService', method: 'findOne', grupoId: id });

    const { data, error } = await this.supabase.from('grupo').select('*').eq('id_grupo', id).is('deleted_at', null).single();

    if (error) {
      if (error.code === 'PGRST116') {
        this.logger.warn('Grupo não encontrado', { module: 'GrupoService', method: 'findOne', grupoId: id });
        throw new NotFoundException('Grupo não encontrado.');
      }
      this.logger.logError(error, { module: 'GrupoService', method: 'findOne', grupoId: id });
      throw new InternalServerErrorException('Falha ao buscar o grupo.');
    }

    this.logger.log('Grupo encontrado com sucesso', { module: 'GrupoService', method: 'findOne', grupoId: id });
    return formatDateFields(data);
  }

  async update(id: string, updateGrupoDto: UpdateGrupoDto) {
    this.logger.log('Iniciando atualização de grupo', { module: 'GrupoService', method: 'update', grupoId: id });

    // Primeiro verifica se o grupo existe
    await this.findOne(id);

    const { data, error } = await this.supabase.from('grupo').update(updateGrupoDto).eq('id_grupo', id).select().single();

    if (error) {
      this.logger.logError(error, { module: 'GrupoService', method: 'update', grupoId: id });
      throw new InternalServerErrorException('Falha ao atualizar o grupo.');
    }

    this.logger.log('Grupo atualizado com sucesso', { module: 'GrupoService', method: 'update', grupoId: id });
    return formatDateFields(data);
  }

  async remove(id: string) {
    return this.softDelete(id);
  }

  async softDelete(id: string) {
    this.logger.log('Iniciando remoção de grupo (soft delete)', { module: 'GrupoService', method: 'softDelete', grupoId: id });

    await this.findOne(id);

    const { data, error } = await this.supabase.from('grupo').update({ deleted_at: new Date().toISOString() }).eq('id_grupo', id).select().single();

    if (error) {
      this.logger.logError(error, { module: 'GrupoService', method: 'softDelete', grupoId: id });
      throw new InternalServerErrorException('Falha ao remover o grupo.');
    }

    this.logger.log('Grupo removido com sucesso (soft delete)', { module: 'GrupoService', method: 'softDelete', grupoId: id });
    return {
      message: 'Grupo removido com sucesso (soft delete)',
      data: formatDateFields(data),
    };
  }

  async restore(id: string) {
    this.logger.log('Iniciando restauração de grupo', { module: 'GrupoService', method: 'restore', grupoId: id });

    const { data: grupo } = await this.supabase.from('grupo').select('deleted_at').eq('id_grupo', id).single();

    if (!grupo) {
      throw new NotFoundException(`Grupo com ID ${id} não encontrado`);
    }

    if (!grupo.deleted_at) {
      throw new BadRequestException('Este grupo não está removido');
    }

    const { data, error } = await this.supabase.from('grupo').update({ deleted_at: null }).eq('id_grupo', id).select().single();

    if (error) {
      this.logger.logError(error, { module: 'GrupoService', method: 'restore', grupoId: id });
      throw new InternalServerErrorException('Falha ao restaurar o grupo.');
    }

    this.logger.log('Grupo restaurado com sucesso', { module: 'GrupoService', method: 'restore', grupoId: id });
    return {
      message: 'Grupo restaurado com sucesso',
      data: formatDateFields(data),
    };
  }

  async findAllWithDeleted(): Promise<any[]> {
    this.logger.log('Buscando todos os grupos incluindo deletados', { module: 'GrupoService', method: 'findAllWithDeleted' });

    const { data, error } = await this.supabase
      .from('grupo')
      .select('*')
      .order('deleted_at', { ascending: false, nullsFirst: true })
      .order('nome_grupo', { ascending: true });

    if (error) {
      this.logger.logError(error, { module: 'GrupoService', method: 'findAllWithDeleted' });
      throw new InternalServerErrorException('Erro ao buscar grupos (incluindo deletados)');
    }

    return formatDateFieldsArray(data || []);
  }
}
