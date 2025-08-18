import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateEstoqueLeiteDto } from './dto/create-estoque-leite.dto';
import { UpdateEstoqueLeiteDto } from './dto/update-estoque-leite.dto';

@Injectable()
export class EstoqueLeiteService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'EstoqueLeite';

  async create(dto: CreateEstoqueLeiteDto, id_usuario: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .insert({
        ...dto,
        id_usuario: id_usuario,
        dt_registro: dto.dt_registro || new Date(),
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao criar registro de estoque: ${error.message}`);
    }
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*, propriedade:Propriedade(nome), usuario:Usuario(nome)')
      .order('dt_registro', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar estoque de leite: ${error.message}`);
    }
    return data;
  }

  async findOne(id_estoque: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*, propriedade:Propriedade(nome), usuario:Usuario(nome)')
      .eq('id_estoque', id_estoque)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Registro de estoque com ID ${id_estoque} não encontrado.`);
    }
    return data;
  }

  async update(id_estoque: number, dto: UpdateEstoqueLeiteDto) {
    await this.findOne(id_estoque);

    const { data, error } = await this.supabase.getClient().from(this.tableName).update(dto).eq('id_estoque', id_estoque).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar registro de estoque: ${error.message}`);
    }
    return data;
  }

  async remove(id_estoque: number) {
    await this.findOne(id_estoque);

    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_estoque', id_estoque);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover registro de estoque: ${error.message}`);
    }
    return { message: 'Registro removido com sucesso' };
  }
}
