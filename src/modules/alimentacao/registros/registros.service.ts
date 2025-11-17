import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateRegistroAlimentacaoDto } from './dto/create-registro.dto';
import { UpdateRegistroAlimentacaoDto } from './dto/update-registro.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';

@Injectable()
export class RegistrosService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

  private readonly tableName = 'alimregistro';

  async create(dto: CreateRegistroAlimentacaoDto) {
    // Validar se o grupo pertence à propriedade
    const { data: grupo, error: grupoError } = await this.supabase
      .getAdminClient()
      .from('grupo')
      .select('id_propriedade')
      .eq('id_grupo', dto.id_grupo)
      .single();

    if (grupoError) {
      this.logger.logError(grupoError, { module: 'RegistrosAlimentacao', method: 'create', step: 'validacao_grupo' });
      throw new NotFoundException('Grupo não encontrado.');
    }

    if (grupo.id_propriedade !== dto.id_propriedade) {
      throw new BadRequestException('O grupo informado não pertence à propriedade especificada.');
    }

    // Validar se a definição de alimentação pertence à propriedade
    const { data: alimentDef, error: alimentError } = await this.supabase
      .getAdminClient()
      .from('alimentacaodef')
      .select('id_propriedade')
      .eq('id_aliment_def', dto.id_aliment_def)
      .single();

    if (alimentError) {
      this.logger.logError(alimentError, { module: 'RegistrosAlimentacao', method: 'create', step: 'validacao_alimentacao_def' });
      throw new NotFoundException('Definição de alimentação não encontrada.');
    }

    if (alimentDef.id_propriedade !== dto.id_propriedade) {
      throw new BadRequestException('A definição de alimentação informada não pertence à propriedade especificada.');
    }

    // Criar o registro de alimentação
    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).insert(dto).select().single();
    if (error) {
      this.logger.logError(error, { module: 'RegistrosAlimentacao', method: 'create' });
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
        grupo:grupo!id_grupo(nome_grupo),
        usuario:usuario!id_usuario(nome)
      `,
      )
      .eq('id_propriedade', idPropriedade)
      .order('dt_registro', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.logError(error, { module: 'RegistrosAlimentacao', method: 'findByPropriedade', idPropriedade });
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
