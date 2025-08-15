import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateAlimentacaoDefDto } from './dto/create-alimentacao-def.dto';
import { UpdateAlimentacaoDefDto } from './dto/update-alimentacao-def.dto';

@Injectable()
export class AlimentacaoDefService {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  async create(createAlimentacaoDefDto: CreateAlimentacaoDefDto) {
    const { data, error } = await this.supabase
      .from('AlimentacaoDef')
      .insert(createAlimentacaoDefDto)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar alimentação definida:', error);
      throw new InternalServerErrorException('Falha ao criar a alimentação definida.');
    }

    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase
      .from('AlimentacaoDef')
      .select('*')
      .order('nome_alimentacao', { ascending: true });

    if (error) {
      console.error('Erro ao buscar alimentações definidas:', error);
      throw new InternalServerErrorException('Falha ao buscar as alimentações definidas.');
    }

    return data;
  }

  async findOne(id: number) {
    const { data, error } = await this.supabase
      .from('AlimentacaoDef')
      .select('*')
      .eq('id_alimentacao_def', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Alimentação definida não encontrada.');
      }
      console.error('Erro ao buscar alimentação definida:', error);
      throw new InternalServerErrorException('Falha ao buscar a alimentação definida.');
    }

    return data;
  }

  async update(id: number, updateAlimentacaoDefDto: UpdateAlimentacaoDefDto) {
    // Primeiro verifica se a alimentação definida existe
    await this.findOne(id);

    const { data, error } = await this.supabase
      .from('AlimentacaoDef')
      .update(updateAlimentacaoDefDto)
      .eq('id_alimentacao_def', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar alimentação definida:', error);
      throw new InternalServerErrorException('Falha ao atualizar a alimentação definida.');
    }

    return data;
  }

  async remove(id: number) {
    // Primeiro verifica se a alimentação definida existe
    await this.findOne(id);

    const { error } = await this.supabase
      .from('AlimentacaoDef')
      .delete()
      .eq('id_alimentacao_def', id);

    if (error) {
      console.error('Erro ao deletar alimentação definida:', error);
      throw new InternalServerErrorException('Falha ao deletar a alimentação definida.');
    }

    return { message: 'Alimentação definida deletada com sucesso.' };
  }
}
