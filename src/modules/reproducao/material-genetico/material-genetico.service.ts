import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateMaterialGeneticoDto } from './dto/create-material-genetico.dto';
import { UpdateMaterialGeneticoDto } from './dto/update-material-genetico.dto';

@Injectable()
export class MaterialGeneticoService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'MaterialGenetico';

  async create(dto: CreateMaterialGeneticoDto) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).insert(dto).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao criar material genético: ${error.message}`);
    }
    return data;
  }

  async findAll() {
    // Adicionando um join para trazer o nome do búfalo de origem, se houver
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*, bufalo_origem:Bufalo(nome, brinco)')
      .order('data_coleta', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar materiais genéticos: ${error.message}`);
    }
    return data;
  }

  async findOne(id_material: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*, bufalo_origem:Bufalo(id_bufalo, nome, brinco)')
      .eq('id_material', id_material)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Material genético com ID ${id_material} não encontrado.`);
    }
    return data;
  }

  async update(id_material: number, dto: UpdateMaterialGeneticoDto) {
    await this.findOne(id_material);

    const { data, error } = await this.supabase.getClient().from(this.tableName).update(dto).eq('id_material', id_material).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar material genético: ${error.message}`);
    }
    return data;
  }

  async remove(id_material: number) {
    await this.findOne(id_material);

    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_material', id_material);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover material genético: ${error.message}`);
    }
    return { message: 'Registro removido com sucesso' };
  }
}
