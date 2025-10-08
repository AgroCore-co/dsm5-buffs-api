import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateEnderecoDto } from './dto/create-endereco.dto';
import { UpdateEnderecoDto } from './dto/update-endereco.dto';

@Injectable()
export class EnderecoService {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  async create(createEnderecoDto: CreateEnderecoDto) {
    const { data, error } = await this.supabase.from('Endereco').insert(createEnderecoDto).select().single();

    if (error) {
      console.error('Erro ao criar endereço:', error);
      throw new InternalServerErrorException('Falha ao criar o endereço.');
    }

    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase.from('Endereco').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar endereços:', error);
      throw new InternalServerErrorException('Falha ao buscar os endereços.');
    }

    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase.from('Endereco').select('*').eq('id_endereco', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Endereço não encontrado.');
      }
      console.error('Erro ao buscar endereço:', error);
      throw new InternalServerErrorException('Falha ao buscar o endereço.');
    }

    return data;
  }

  async update(id: string, updateEnderecoDto: UpdateEnderecoDto) {
    // Primeiro verifica se o endereço existe
    await this.findOne(id);

    const { data, error } = await this.supabase
      .from('Endereco')
      .update({
        ...updateEnderecoDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id_endereco', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar endereço:', error);
      throw new InternalServerErrorException('Falha ao atualizar o endereço.');
    }

    return data;
  }

  async remove(id: string) {
    // Primeiro verifica se o endereço existe
    await this.findOne(id);

    const { error } = await this.supabase.from('Endereco').delete().eq('id_endereco', id);

    if (error) {
      console.error('Erro ao deletar endereço:', error);
      throw new InternalServerErrorException('Falha ao deletar o endereço.');
    }

    return { message: 'Endereço deletado com sucesso.' };
  }
}
