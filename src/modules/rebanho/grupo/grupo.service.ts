import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';

@Injectable()
export class GrupoService {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  async create(createGrupoDto: CreateGrupoDto) {
    const { data, error } = await this.supabase
      .from('Grupo')
      .insert(createGrupoDto)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar grupo:', error);
      throw new InternalServerErrorException('Falha ao criar o grupo.');
    }

    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase
      .from('Grupo')
      .select('*')
      .order('nome_grupo', { ascending: true });

    if (error) {
      console.error('Erro ao buscar grupos:', error);
      throw new InternalServerErrorException('Falha ao buscar os grupos.');
    }

    return data;
  }

  async findOne(id: number) {
    const { data, error } = await this.supabase
      .from('Grupo')
      .select('*')
      .eq('id_grupo', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Grupo não encontrado.');
      }
      console.error('Erro ao buscar grupo:', error);
      throw new InternalServerErrorException('Falha ao buscar o grupo.');
    }

    return data;
  }

  async update(id: number, updateGrupoDto: UpdateGrupoDto) {
    // Primeiro verifica se o grupo existe
    await this.findOne(id);

    const { data, error } = await this.supabase
      .from('Grupo')
      .update(updateGrupoDto)
      .eq('id_grupo', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar grupo:', error);
      throw new InternalServerErrorException('Falha ao atualizar o grupo.');
    }

    return data;
  }

  async remove(id: number) {
    // Primeiro verifica se o grupo existe
    await this.findOne(id);

    const { error } = await this.supabase
      .from('Grupo')
      .delete()
      .eq('id_grupo', id);

    if (error) {
      console.error('Erro ao deletar grupo:', error);
      throw new InternalServerErrorException('Falha ao deletar o grupo.');
    }

    return { message: 'Grupo deletado com sucesso.' };
  }
}
