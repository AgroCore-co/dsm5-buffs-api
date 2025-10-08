import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateRacaDto } from './dto/create-raca.dto';
import { UpdateRacaDto } from './dto/update-raca.dto';

@Injectable()
export class RacaService {
  private supabase: SupabaseClient;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly logger: LoggerService,
  ) {
    this.supabase = this.supabaseService.getClient();
  }

  async create(createRacaDto: CreateRacaDto) {
    this.logger.log('Iniciando criação de raça', { module: 'RacaService', method: 'create' });

    const { data, error } = await this.supabase.from('Raca').insert(createRacaDto).select().single();

    if (error) {
      this.logger.logError(error, { module: 'RacaService', method: 'create' });
      throw new InternalServerErrorException('Falha ao criar a raça.');
    }

    this.logger.log('Raça criada com sucesso', { module: 'RacaService', method: 'create', racaId: data.id_raca });
    return data;
  }

  async findAll() {
    this.logger.log('Iniciando busca de todas as raças', { module: 'RacaService', method: 'findAll' });

    const { data, error } = await this.supabase.from('Raca').select('*').order('nome', { ascending: true });

    if (error) {
      this.logger.logError(error, { module: 'RacaService', method: 'findAll' });
      throw new InternalServerErrorException('Falha ao buscar as raças.');
    }

    this.logger.log(`Busca de raças concluída - ${data.length} raças encontradas`, { module: 'RacaService', method: 'findAll' });
    return data;
  }

  async findOne(id: string) {
    this.logger.log('Iniciando busca de raça por ID', { module: 'RacaService', method: 'findOne', racaId: id });

    const { data, error } = await this.supabase.from('Raca').select('*').eq('id_raca', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        this.logger.warn('Raça não encontrada', { module: 'RacaService', method: 'findOne', racaId: id });
        throw new NotFoundException('Raça não encontrada.');
      }
      this.logger.logError(error, { module: 'RacaService', method: 'findOne', racaId: id });
      throw new InternalServerErrorException('Falha ao buscar a raça.');
    }

    this.logger.log('Raça encontrada com sucesso', { module: 'RacaService', method: 'findOne', racaId: id });
    return data;
  }

  async update(id: string, updateRacaDto: UpdateRacaDto) {
    this.logger.log('Iniciando atualização de raça', { module: 'RacaService', method: 'update', racaId: id });

    // Primeiro verifica se a raça existe
    await this.findOne(id);

    const { data, error } = await this.supabase.from('Raca').update(updateRacaDto).eq('id_raca', id).select().single();

    if (error) {
      this.logger.logError(error, { module: 'RacaService', method: 'update', racaId: id });
      throw new InternalServerErrorException('Falha ao atualizar a raça.');
    }

    this.logger.log('Raça atualizada com sucesso', { module: 'RacaService', method: 'update', racaId: id });
    return data;
  }

  async remove(id: string) {
    this.logger.log('Iniciando remoção de raça', { module: 'RacaService', method: 'remove', racaId: id });

    // Primeiro verifica se a raça existe
    await this.findOne(id);

    const { error } = await this.supabase.from('Raca').delete().eq('id_raca', id);

    if (error) {
      this.logger.logError(error, { module: 'RacaService', method: 'remove', racaId: id });
      throw new InternalServerErrorException('Falha ao deletar a raça.');
    }

    this.logger.log('Raça removida com sucesso', { module: 'RacaService', method: 'remove', racaId: id });
    return { message: 'Raça deletada com sucesso.' };
  }
}
