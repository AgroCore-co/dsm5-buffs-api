import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';

@Injectable()
export class ColetaService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'Coleta';

  async create(dto: any) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).insert(dto).select().single();
    if (error) throw new InternalServerErrorException('Falha ao criar coleta.');
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').order('dt_coleta', { ascending: false });
    if (error) throw new InternalServerErrorException('Falha ao buscar coletas.');
    return data;
  }

  async findOne(id_coleta: number) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').eq('id_coleta', id_coleta).single();
    if (error) throw new NotFoundException('Coleta não encontrada.');
    return data;
  }

  async update(id_coleta: number, dto: any) {
    await this.findOne(id_coleta);
    const { data, error } = await this.supabase.getClient().from(this.tableName).update(dto).eq('id_coleta', id_coleta).select().single();
    if (error) throw new InternalServerErrorException('Falha ao atualizar coleta.');
    return data;
  }

  async remove(id_coleta: number) {
    await this.findOne(id_coleta);
    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_coleta', id_coleta);
    if (error) throw new InternalServerErrorException('Falha ao remover coleta.');
    return { message: 'Coleta removida com sucesso' };
  }
}
