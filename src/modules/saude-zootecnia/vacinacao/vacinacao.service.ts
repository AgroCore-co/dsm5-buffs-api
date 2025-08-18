import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateVacinacaoDto } from './dto/create-vacinacao.dto';
import { UpdateVacinacaoDto } from './dto/update-vacinacao.dto';

@Injectable()
export class VacinacaoService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'Vacinacao';

  async create(dto: CreateVacinacaoDto, id_bufalo: number, id_usuario: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .insert({
        ...dto,
        id_bufalo: id_bufalo,
        id_usuario: id_usuario,
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao criar registro de vacinação: ${error.message}`);
    }
    return data;
  }

  async findAllByBufalo(id_bufalo: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*')
      .eq('id_bufalo', id_bufalo)
      .order('dt_aplicacao', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar vacinas do búfalo: ${error.message}`);
    }
    return data;
  }

  async findOne(id_vacinacao: number) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').eq('id_vacinacao', id_vacinacao).single();

    if (error || !data) {
      throw new NotFoundException(`Registro de vacinação com ID ${id_vacinacao} não encontrado.`);
    }
    return data;
  }

  async update(id_vacinacao: number, dto: UpdateVacinacaoDto) {
    await this.findOne(id_vacinacao);

    const { data, error } = await this.supabase.getClient().from(this.tableName).update(dto).eq('id_vacinacao', id_vacinacao).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar registro de vacinação: ${error.message}`);
    }
    return data;
  }

  async remove(id_vacinacao: number) {
    await this.findOne(id_vacinacao);

    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_vacinacao', id_vacinacao);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover registro de vacinação: ${error.message}`);
    }
    return { message: 'Registro de vacinação removido com sucesso' };
  }
}
