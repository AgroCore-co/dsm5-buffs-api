import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';

@Injectable()
export class EstoqueLeiteService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'EstoqueLeite';

  async create(dto: any) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).insert(dto).select().single();
    if (error) throw new InternalServerErrorException('Falha ao criar registro de estoque.');
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').order('dt_registro', { ascending: false });
    if (error) throw new InternalServerErrorException('Falha ao buscar estoque de leite.');
    return data;
  }

  async findOne(id_estoque: number) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').eq('id_estoque', id_estoque).single();
    if (error) throw new NotFoundException('Registro de estoque não encontrado.');
    return data;
  }

  async update(id_estoque: number, dto: any) {
    await this.findOne(id_estoque);
    const { data, error } = await this.supabase.getClient().from(this.tableName).update(dto).eq('id_estoque', id_estoque).select().single();
    if (error) throw new InternalServerErrorException('Falha ao atualizar registro de estoque.');
    return data;
  }

  async remove(id_estoque: number) {
    await this.findOne(id_estoque);
    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_estoque', id_estoque);
    if (error) throw new InternalServerErrorException('Falha ao remover registro de estoque.');
    return { message: 'Registro removido com sucesso' };
  }
}


