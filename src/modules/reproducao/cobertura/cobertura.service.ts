import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';

@Injectable()
export class CoberturaService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'DadosReproducao';

  async create(dto: any) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).insert(dto).select().single();
    if (error) throw new InternalServerErrorException('Falha ao criar dado de reprodução.');
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').order('created_at', { ascending: false });
    if (error) throw new InternalServerErrorException('Falha ao buscar dados de reprodução.');
    return data;
  }

  async findOne(id_repro: number) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').eq('id_repro', id_repro).single();
    if (error) throw new NotFoundException('Dado de reprodução não encontrado.');
    return data;
  }

  async update(id_repro: number, dto: any) {
    await this.findOne(id_repro);
    const { data, error } = await this.supabase.getClient().from(this.tableName).update(dto).eq('id_repro', id_repro).select().single();
    if (error) throw new InternalServerErrorException('Falha ao atualizar dado de reprodução.');
    return data;
  }

  async remove(id_repro: number) {
    await this.findOne(id_repro);
    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_repro', id_repro);
    if (error) throw new InternalServerErrorException('Falha ao remover dado de reprodução.');
    return { message: 'Registro removido com sucesso' };
  }
}
