import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';

@Injectable()
export class MaterialGeneticoService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'MaterialGenetico';

  async create(dto: any) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).insert(dto).select().single();
    if (error) throw new InternalServerErrorException('Falha ao criar material genético.');
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').order('created_at', { ascending: false });
    if (error) throw new InternalServerErrorException('Falha ao buscar materiais genéticos.');
    return data;
  }

  async findOne(id_material: number) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').eq('id_material', id_material).single();
    if (error) throw new NotFoundException('Material genético não encontrado.');
    return data;
  }

  async update(id_material: number, dto: any) {
    await this.findOne(id_material);
    const { data, error } = await this.supabase.getClient().from(this.tableName).update(dto).eq('id_material', id_material).select().single();
    if (error) throw new InternalServerErrorException('Falha ao atualizar material genético.');
    return data;
  }

  async remove(id_material: number) {
    await this.findOne(id_material);
    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_material', id_material);
    if (error) throw new InternalServerErrorException('Falha ao remover material genético.');
    return { message: 'Registro removido com sucesso' };
  }
}
