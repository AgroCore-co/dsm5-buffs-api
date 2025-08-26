import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateCicloLactacaoDto } from './dto/create-ciclo-lactacao.dto';
import { UpdateCicloLactacaoDto } from './dto/update-ciclo-lactacao.dto';

@Injectable()
export class CicloLactacaoService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'CicloLactacao';

  private computeSecagemPrevista(dt_parto: string, padrao_dias: number): string {
    const baseDate = new Date(dt_parto);
    const result = new Date(baseDate);
    result.setDate(result.getDate() + padrao_dias);
    return result.toISOString().slice(0, 10);
  }

  private computeStatus(dt_secagem_real?: string | null): string {
    return dt_secagem_real ? 'Seca' : 'Em Lactação';
  }

  async create(dto: CreateCicloLactacaoDto) {
    const dt_secagem_prevista = this.computeSecagemPrevista(dto.dt_parto, dto.padrao_dias);
    const status = this.computeStatus(dto.dt_secagem_real);

    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .insert({
        ...dto,
        dt_secagem_prevista,
        status,
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao criar ciclo de lactação: ${error.message}`);
    }
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*, bufala:Bufalo(nome)')
      .order('dt_parto', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar ciclos de lactação: ${error.message}`);
    }
    return data;
  }

  async findOne(id_ciclo_lactacao: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*, bufala:Bufalo(nome)')
      .eq('id_ciclo_lactacao', id_ciclo_lactacao)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Ciclo de lactação com ID ${id_ciclo_lactacao} não encontrado.`);
    }
    return data;
  }

  async update(id_ciclo_lactacao: number, dto: UpdateCicloLactacaoDto) {
    const current = await this.findOne(id_ciclo_lactacao);

    const dt_parto = dto.dt_parto ?? current.dt_parto;
    const padrao_dias = dto.padrao_dias ?? current.padrao_dias;
    const dt_secagem_prevista = this.computeSecagemPrevista(dt_parto, padrao_dias);
    const status = this.computeStatus(dto.dt_secagem_real ?? current.dt_secagem_real);

    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .update({
        ...dto,
        dt_secagem_prevista,
        status,
      })
      .eq('id_ciclo_lactacao', id_ciclo_lactacao)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar ciclo de lactação: ${error.message}`);
    }
    return data;
  }

  async remove(id_ciclo_lactacao: number) {
    await this.findOne(id_ciclo_lactacao);

    const { error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .delete()
      .eq('id_ciclo_lactacao', id_ciclo_lactacao);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover ciclo de lactação: ${error.message}`);
    }
    return { message: 'Ciclo removido com sucesso' };
  }
}


