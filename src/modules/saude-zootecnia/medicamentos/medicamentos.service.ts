import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateMedicacaoDto } from './dto/create-medicacao.dto';
import { UpdateMedicacaoDto } from './dto/update-medicacao.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';

@Injectable()
export class MedicamentosService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'medicacoes';

  async create(dto: CreateMedicacaoDto) {
    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).insert(dto).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao criar medicação: ${error.message}`);
    }
    return formatDateFields(data);
  }

  async findAll() {
    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).select('*').order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar medicações: ${error.message}`);
    }
    return formatDateFieldsArray(data);
  }

  async findByPropriedade(id_propriedade: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .eq('id_propriedade', id_propriedade)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar medicações da propriedade: ${error.message}`);
    }
    return formatDateFieldsArray(data);
  }

  async findOne(id_medicacao: string) {
    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).select('*').eq('id_medicacao', id_medicacao).single();

    if (error || !data) {
      throw new NotFoundException(`Medicação com ID ${id_medicacao} não encontrada.`);
    }
    return formatDateFields(data);
  }

  async update(id_medicacao: string, dto: UpdateMedicacaoDto) {
    await this.findOne(id_medicacao); // Garante que existe

    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).update(dto).eq('id_medicacao', id_medicacao).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar medicação: ${error.message}`);
    }
    return formatDateFields(data);
  }

  async remove(id_medicacao: string) {
    await this.findOne(id_medicacao); // Garante que existe

    const { error } = await this.supabase.getAdminClient().from(this.tableName).delete().eq('id_medicacao', id_medicacao);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover medicação: ${error.message}`);
    }
    return { message: 'Medicação removida com sucesso' };
  }
}
