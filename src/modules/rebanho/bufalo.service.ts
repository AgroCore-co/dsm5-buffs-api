import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBufaloDto } from './dto/create-bufalo.dto';
import { UpdateBufaloDto } from './dto/update-bufalo.dto';
import { SupabaseService } from '../../core/supabase/supabase.service';

@Injectable()
export class BufaloService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'Bufalo';

  async create(createBufaloDto: CreateBufaloDto) {
    const { data, error } = await this.supabase.getClient()
      .from(this.tableName)
      .insert(createBufaloDto)
      .select()
      .single();

    if (error) {
      // Tratar erros específicos do Supabase se necessário
      throw new Error(error.message);
    }
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase.getClient()
      .from(this.tableName)
      .select('*');

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findOne(id: number) {
    const { data, error } = await this.supabase.getClient()
      .from(this.tableName)
      .select('*')
      .eq('id_bufalo', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Búfalo com ID ${id} não encontrado.`);
    }
    return data;
  }

  async update(id: number, updateBufaloDto: UpdateBufaloDto) {
    // Primeiro, verifica se o búfalo existe
    await this.findOne(id);

    const { data, error } = await this.supabase.getClient()
      .from(this.tableName)
      .update(updateBufaloDto)
      .eq('id_bufalo', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async remove(id: number) {
    // Primeiro, verifica se o búfalo existe
    await this.findOne(id);

    const { error } = await this.supabase.getClient()
      .from(this.tableName)
      .delete()
      .eq('id_bufalo', id);

    if (error) {
      throw new Error(error.message);
    }
    return { message: `Búfalo com ID ${id} deletado com sucesso.` };
  }
}
