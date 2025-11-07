import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateRegistroAlimentacaoDto } from './dto/create-registro.dto';
import { UpdateRegistroAlimentacaoDto } from './dto/update-registro.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';

@Injectable()
export class RegistrosService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'alimregistro';

  async create(dto: CreateRegistroAlimentacaoDto) {
    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).insert(dto).select().single();
    if (error) {
      console.error('Erro ao criar registro de alimentação:', error);
      throw new InternalServerErrorException(`Falha ao criar registro de alimentação: ${error.message}`);
    }
    return formatDateFields(data);
  }

  async findAll() {
    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).select('*').order('created_at', { ascending: false });
    if (error) {
      if ((error as any).code === 'PGRST116') {
        return [];
      }
      throw new InternalServerErrorException('Falha ao buscar registros de alimentação.');
    }
    return formatDateFieldsArray(data ?? []);
  }

  async findByPropriedade(idPropriedade: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select(
        `
        *,
        alimentacao_def:alimentacaodef!id_aliment_def(tipo_alimentacao, descricao),
        grupo:grupo!id_grupo(nome_grupo, nivel_maturidade),
        usuario:usuario!id_usuario(nome)
      `,
      )
      .eq('id_propriedade', idPropriedade)
      .order('dt_registro', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar registros de alimentação por propriedade:', error);
      throw new InternalServerErrorException('Falha ao buscar registros de alimentação da propriedade.');
    }

    return formatDateFieldsArray(data);
  }

  async findOne(id_registro: string) {
    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).select('*').eq('id_registro', id_registro).single();
    if (error) throw new NotFoundException('Registro de alimentação não encontrado.');
    return formatDateFields(data);
  }

  async update(id_registro: string, dto: UpdateRegistroAlimentacaoDto) {
    await this.findOne(id_registro);
    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).update(dto).eq('id_registro', id_registro).select().single();
    if (error) throw new InternalServerErrorException('Falha ao atualizar registro de alimentação.');
    return formatDateFields(data);
  }

  async remove(id_registro: string) {
    await this.findOne(id_registro);
    const { error } = await this.supabase.getAdminClient().from(this.tableName).delete().eq('id_registro', id_registro);
    if (error) throw new InternalServerErrorException('Falha ao remover registro de alimentação.');
    return { message: 'Registro removido com sucesso' };
  }
}
