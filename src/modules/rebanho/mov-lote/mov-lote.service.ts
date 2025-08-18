import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateMovLoteDto } from './dto/create-mov-lote.dto';
import { UpdateMovLoteDto } from './dto/update-mov-lote.dto';

@Injectable()
export class MovLoteService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'MovLote';

  async create(dto: CreateMovLoteDto) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).insert(dto).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao criar movimento de lote: ${error.message}`);
    }
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').order('dt_entrada', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar movimentos de lote: ${error.message}`);
    }
    return data;
  }

  async findOne(id_movimento: number) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').eq('id_movimento', id_movimento).single();

    if (error || !data) {
      throw new NotFoundException(`Movimento de lote com ID ${id_movimento} não encontrado.`);
    }
    return data;
  }

  async update(id_movimento: number, dto: UpdateMovLoteDto) {
    await this.findOne(id_movimento);

    const { data, error } = await this.supabase.getClient().from(this.tableName).update(dto).eq('id_movimento', id_movimento).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar movimento de lote: ${error.message}`);
    }
    return data;
  }

  async remove(id_movimento: number) {
    await this.findOne(id_movimento);

    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_movimento', id_movimento);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover movimento de lote: ${error.message}`);
    }
    return { message: 'Registro removido com sucesso' };
  }
}
