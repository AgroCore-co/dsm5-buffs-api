import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';

@Injectable()
export class GrupoService {
  private supabase: SupabaseClient;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly logger: LoggerService,
  ) {
    this.supabase = this.supabaseService.getClient();
  }

  async create(createGrupoDto: CreateGrupoDto) {
    this.logger.log('Iniciando criação de grupo', { module: 'GrupoService', method: 'create' });

    const { data, error } = await this.supabase.from('Grupo').insert(createGrupoDto).select().single();

    if (error) {
      this.logger.logError(error, { module: 'GrupoService', method: 'create' });
      throw new InternalServerErrorException('Falha ao criar o grupo.');
    }

    this.logger.log('Grupo criado com sucesso', { module: 'GrupoService', method: 'create', grupoId: data.id_grupo });
    return data;
  }

  async findAll() {
    this.logger.log('Iniciando busca de todos os grupos', { module: 'GrupoService', method: 'findAll' });

    const { data, error } = await this.supabase.from('Grupo').select('*').order('nome_grupo', { ascending: true });

    if (error) {
      this.logger.logError(error, { module: 'GrupoService', method: 'findAll' });
      throw new InternalServerErrorException('Falha ao buscar os grupos.');
    }

    this.logger.log(`Busca de grupos concluída - ${data.length} grupos encontrados`, { module: 'GrupoService', method: 'findAll' });
    return data;
  }

  async findOne(id: string) {
    this.logger.log('Iniciando busca de grupo por ID', { module: 'GrupoService', method: 'findOne', grupoId: id });

    const { data, error } = await this.supabase.from('Grupo').select('*').eq('id_grupo', id).single();

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

    const { data, error } = await this.supabase.from('Grupo').update(updateGrupoDto).eq('id_grupo', id).select().single();

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

    const { error } = await this.supabase.from('Grupo').delete().eq('id_grupo', id);

    if (error) {
      this.logger.logError(error, { module: 'GrupoService', method: 'remove', grupoId: id });
      throw new InternalServerErrorException('Falha ao deletar o grupo.');
    }

    this.logger.log('Grupo removido com sucesso', { module: 'GrupoService', method: 'remove', grupoId: id });
    return { message: 'Grupo deletado com sucesso.' };
  }
}
