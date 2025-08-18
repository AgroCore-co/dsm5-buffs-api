import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateColetaDto } from './dto/create-coleta.dto';
import { UpdateColetaDto } from './dto/update-coleta.dto';

@Injectable()
export class ColetaService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'Coleta';

  async create(dto: CreateColetaDto, id_funcionario: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .insert({
        ...dto,
        id_funcionario: id_funcionario,
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao criar coleta: ${error.message}`);
    }
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*, industria:Industria(nome), funcionario:Usuario(nome)')
      .order('dt_coleta', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar coletas: ${error.message}`);
    }
    return data;
  }

  async findOne(id_coleta: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*, industria:Industria(nome, representante), funcionario:Usuario(nome, cargo)')
      .eq('id_coleta', id_coleta)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Coleta com ID ${id_coleta} não encontrada.`);
    }
    return data;
  }

  async update(id_coleta: number, dto: UpdateColetaDto) {
    await this.findOne(id_coleta);

    const { data, error } = await this.supabase.getClient().from(this.tableName).update(dto).eq('id_coleta', id_coleta).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar coleta: ${error.message}`);
    }
    return data;
  }

  async remove(id_coleta: number) {
    await this.findOne(id_coleta);

    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_coleta', id_coleta);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover coleta: ${error.message}`);
    }
    return { message: 'Coleta removida com sucesso' };
  }
}
