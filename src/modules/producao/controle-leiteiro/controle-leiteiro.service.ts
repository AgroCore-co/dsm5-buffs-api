import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';

@Injectable()
export class ControleLeiteiroService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'DadosLactacao';

  async create(dto: any) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).insert(dto).select().single();
    if (error) throw new InternalServerErrorException('Falha ao criar dado de lactação.');
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').order('dt_ordenha', { ascending: false });
    if (error) throw new InternalServerErrorException('Falha ao buscar dados de lactação.');
    return data;
  }

  async findOne(id_lact: number) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').eq('id_lact', id_lact).single();
    if (error) throw new NotFoundException('Dado de lactação não encontrado.');
    return data;
  }

  async update(id_lact: number, dto: any) {
    await this.findOne(id_lact);
    const { data, error } = await this.supabase.getClient().from(this.tableName).update(dto).eq('id_lact', id_lact).select().single();
    if (error) throw new InternalServerErrorException('Falha ao atualizar dado de lactação.');
    return data;
  }

  async remove(id_lact: number) {
    await this.findOne(id_lact);
    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_lact', id_lact);
    if (error) throw new InternalServerErrorException('Falha ao remover dado de lactação.');
    return { message: 'Registro removido com sucesso' };
  }
}
