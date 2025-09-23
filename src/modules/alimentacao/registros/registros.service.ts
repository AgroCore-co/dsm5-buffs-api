import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateRegistroAlimentacaoDto } from './dto/create-registro.dto';
import { UpdateRegistroAlimentacaoDto } from './dto/update-registro.dto';

@Injectable()
export class RegistrosService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'AlimRegistro';

  async create(dto: CreateRegistroAlimentacaoDto) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).insert(dto).select().single();
    if (error) throw new InternalServerErrorException('Falha ao criar registro de alimentação.');
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').order('created_at', { ascending: false });
    if (error) throw new InternalServerErrorException('Falha ao buscar registros de alimentação.');
    return data;
  }

  async findByPropriedade(idPropriedade: number) {
    const { data, error } = await this.supabase.getClient()
      .from(this.tableName)
      .select(`
        *,
        alimentacao_def:AlimentacaoDef!id_aliment_def(tipo_alimentacao, descricao),
        grupo:Grupo!id_grupo(nome_grupo, nivel_maturidade),
        usuario:Usuario!id_usuario(nome)
      `)
      .eq('id_propriedade', idPropriedade)
      .order('dt_registro', { ascending: false })
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Erro ao buscar registros de alimentação por propriedade:', error);
      throw new InternalServerErrorException('Falha ao buscar registros de alimentação da propriedade.');
    }
    
    return data;
  }

  async findOne(id_registro: number) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').eq('id_registro', id_registro).single();
    if (error) throw new NotFoundException('Registro de alimentação não encontrado.');
    return data;
  }

  async update(id_registro: number, dto: UpdateRegistroAlimentacaoDto) {
    await this.findOne(id_registro);
    const { data, error } = await this.supabase.getClient().from(this.tableName).update(dto).eq('id_registro', id_registro).select().single();
    if (error) throw new InternalServerErrorException('Falha ao atualizar registro de alimentação.');
    return data;
  }

  async remove(id_registro: number) {
    await this.findOne(id_registro);
    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_registro', id_registro);
    if (error) throw new InternalServerErrorException('Falha ao remover registro de alimentação.');
    return { message: 'Registro removido com sucesso' };
  }
}
