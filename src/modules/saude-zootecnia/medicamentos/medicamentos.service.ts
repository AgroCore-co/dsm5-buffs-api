import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateMedicacaoDto } from './dto/create-medicacao.dto';
import { UpdateMedicacaoDto } from './dto/update-medicacao.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { ISoftDelete } from '../../../core/interfaces';

@Injectable()
export class MedicamentosService implements ISoftDelete {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

  private readonly tableName = 'medicacoes';

  async create(dto: CreateMedicacaoDto) {
    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).insert(dto).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao criar medicação: ${error.message}`);
    }
    return formatDateFields(data);
  }

  async findAll() {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

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
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar medicações da propriedade: ${error.message}`);
    }
    return formatDateFieldsArray(data);
  }

  async findOne(id_medicacao: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .eq('id_medicacao', id_medicacao)
      .is('deleted_at', null)
      .single();

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
    return this.softDelete(id_medicacao);
  }

  async softDelete(id: string) {
    await this.findOne(id);

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id_medicacao', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover medicação: ${error.message}`);
    }

    return {
      message: 'Medicação removida com sucesso (soft delete)',
      data: formatDateFields(data),
    };
  }

  async restore(id: string) {
    const { data: medicacao } = await this.supabase.getAdminClient().from(this.tableName).select('deleted_at').eq('id_medicacao', id).single();

    if (!medicacao) {
      throw new NotFoundException(`Medicação com ID ${id} não encontrada`);
    }

    if (!medicacao.deleted_at) {
      throw new BadRequestException('Esta medicação não está removida');
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .update({ deleted_at: null })
      .eq('id_medicacao', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao restaurar medicação: ${error.message}`);
    }

    return {
      message: 'Medicação restaurada com sucesso',
      data: formatDateFields(data),
    };
  }

  async findAllWithDeleted(): Promise<any[]> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .order('deleted_at', { ascending: false, nullsFirst: true })
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException('Erro ao buscar medicações (incluindo deletadas)');
    }

    return formatDateFieldsArray(data || []);
  }
}
