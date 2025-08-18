import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateRacaDto } from './dto/create-raca.dto';
import { UpdateRacaDto } from './dto/update-raca.dto';

@Injectable()
export class RacaService {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  async create(createRacaDto: CreateRacaDto) {
    const { data, error } = await this.supabase.from('Raca').insert(createRacaDto).select().single();

    if (error) {
      console.error('Erro ao criar raça:', error);
      throw new InternalServerErrorException('Falha ao criar a raça.');
    }

    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase.from('Raca').select('*').order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar raças:', error);
      throw new InternalServerErrorException('Falha ao buscar as raças.');
    }

    return data;
  }

  async findOne(id: number) {
    const { data, error } = await this.supabase.from('Raca').select('*').eq('id_raca', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Raça não encontrada.');
      }
      console.error('Erro ao buscar raça:', error);
      throw new InternalServerErrorException('Falha ao buscar a raça.');
    }

    return data;
  }

  async update(id: number, updateRacaDto: UpdateRacaDto) {
    // Primeiro verifica se a raça existe
    await this.findOne(id);

    const { data, error } = await this.supabase.from('Raca').update(updateRacaDto).eq('id_raca', id).select().single();

    if (error) {
      console.error('Erro ao atualizar raça:', error);
      throw new InternalServerErrorException('Falha ao atualizar a raça.');
    }

    return data;
  }

  async remove(id: number) {
    // Primeiro verifica se a raça existe
    await this.findOne(id);

    const { error } = await this.supabase.from('Raca').delete().eq('id_raca', id);

    if (error) {
      console.error('Erro ao deletar raça:', error);
      throw new InternalServerErrorException('Falha ao deletar a raça.');
    }

    return { message: 'Raça deletada com sucesso.' };
  }
}
