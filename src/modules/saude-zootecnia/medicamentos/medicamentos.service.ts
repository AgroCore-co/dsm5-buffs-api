import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';

@Injectable()
export class MedicamentosService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'DadosSanitarios';

  async create(dto: any) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).insert(dto).select().single();
    if (error) throw new InternalServerErrorException('Falha ao criar dado sanitário.');
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').order('created_at', { ascending: false });
    if (error) throw new InternalServerErrorException('Falha ao buscar dados sanitários.');
    return data;
  }

  async findOne(id_sanit: number) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').eq('id_sanit', id_sanit).single();
    if (error) throw new NotFoundException('Dado sanitário não encontrado.');
    return data;
  }

  async update(id_sanit: number, dto: any) {
    await this.findOne(id_sanit);
    const { data, error } = await this.supabase.getClient().from(this.tableName).update(dto).eq('id_sanit', id_sanit).select().single();
    if (error) throw new InternalServerErrorException('Falha ao atualizar dado sanitário.');
    return data;
  }

  async remove(id_sanit: number) {
    await this.findOne(id_sanit);
    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_sanit', id_sanit);
    if (error) throw new InternalServerErrorException('Falha ao remover dado sanitário.');
    return { message: 'Registro removido com sucesso' };
  }
}
