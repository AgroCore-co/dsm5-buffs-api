import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';

@Injectable()
export class GrupoService {
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
    return data;
  }

  async findAll() {
    this.logger.log('Iniciando busca de todos os grupos', { module: 'GrupoService', method: 'findAll' });

    const { data, error } = await this.supabase.from('grupo').select('*').order('nome_grupo', { ascending: true });

    if (error) {
      this.logger.logError(error, { module: 'GrupoService', method: 'findAll' });
      throw new InternalServerErrorException('Falha ao buscar os grupos.');
    }

    this.logger.log(`Busca de grupos concluída - ${data.length} grupos encontrados`, { module: 'GrupoService', method: 'findAll' });
    return data;
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
      .eq('id_propriedade', id_propriedade);

    if (countError) {
      this.logger.logError(countError, {
        module: 'GrupoService',
        method: 'findByPropriedade',
      });
      throw new InternalServerErrorException(`Falha ao contar grupos da propriedade: ${countError.message}`);
    }

    const { data, error } = await this.supabase
      .from('grupo')
      .select('*, propriedade:Propriedade(nome)')
      .eq('id_propriedade', id_propriedade)
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

    return createPaginatedResponse(data, count || 0, page, limitValue);
  }

  async findOne(id: string) {
    this.logger.log('Iniciando busca de grupo por ID', { module: 'GrupoService', method: 'findOne', grupoId: id });

    const { data, error } = await this.supabase.from('grupo').select('*').eq('id_grupo', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        this.logger.warn('Grupo não encontrado', { module: 'GrupoService', method: 'findOne', grupoId: id });
        throw new NotFoundException('Grupo não encontrado.');
      }
      this.logger.logError(error, { module: 'GrupoService', method: 'findOne', grupoId: id });
      throw new InternalServerErrorException('Falha ao buscar o grupo.');
    }

    this.logger.log('Grupo encontrado com sucesso', { module: 'GrupoService', method: 'findOne', grupoId: id });
    return data;
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
    return data;
  }

  async remove(id: string) {
    this.logger.log('Iniciando remoção de grupo', { module: 'GrupoService', method: 'remove', grupoId: id });

    // Primeiro verifica se o grupo existe
    await this.findOne(id);

    const { error } = await this.supabase.from('grupo').delete().eq('id_grupo', id);

    if (error) {
      this.logger.logError(error, { module: 'GrupoService', method: 'remove', grupoId: id });
      throw new InternalServerErrorException('Falha ao deletar o grupo.');
    }

    this.logger.log('Grupo removido com sucesso', { module: 'GrupoService', method: 'remove', grupoId: id });
    return { message: 'Grupo deletado com sucesso.' };
  }
}
