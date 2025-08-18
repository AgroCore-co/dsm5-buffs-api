import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { CreateBufaloDto } from './dto/create-bufalo.dto';
import { UpdateBufaloDto } from './dto/update-bufalo.dto';
import { SupabaseService } from '../../core/supabase/supabase.service';

@Injectable()
export class BufaloService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'Bufalo';

  async create(createBufaloDto: CreateBufaloDto) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).insert(createBufaloDto).select().single();

    if (error) {
      console.error('Erro ao criar búfalo:', error);
      throw new InternalServerErrorException('Falha ao criar o búfalo.');
    }
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar búfalos:', error);
      throw new InternalServerErrorException('Falha ao buscar os búfalos.');
    }
    return data;
  }

  async findOne(id: number) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').eq('id_bufalo', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Búfalo com ID ${id} não encontrado.`);
      }
      console.error('Erro ao buscar búfalo:', error);
      throw new InternalServerErrorException('Falha ao buscar o búfalo.');
    }
    return data;
  }

  async update(id: number, updateBufaloDto: UpdateBufaloDto) {
    // Primeiro, verifica se o búfalo existe
    await this.findOne(id);

    const { data, error } = await this.supabase.getClient().from(this.tableName).update(updateBufaloDto).eq('id_bufalo', id).select().single();

    if (error) {
      console.error('Erro ao atualizar búfalo:', error);
      throw new InternalServerErrorException('Falha ao atualizar o búfalo.');
    }
    return data;
  }

  async remove(id: number) {
    // Primeiro, verifica se o búfalo existe
    await this.findOne(id);

    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_bufalo', id);

    if (error) {
      console.error('Erro ao deletar búfalo:', error);
      throw new InternalServerErrorException('Falha ao deletar o búfalo.');
    }
    return { message: `Búfalo com ID ${id} deletado com sucesso.` };
  }
}
