import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateDadoZootecnicoDto } from './dto/create-dado-zootecnico.dto';
import { UpdateDadoZootecnicoDto } from './dto/update-dado-zootecnico.dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { ISoftDelete } from '../../../core/interfaces';

@Injectable()
export class DadosZootecnicosService implements ISoftDelete {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

  private readonly tableName = 'dadoszootecnicos';

  /**
   * Função auxiliar CORRIGIDA.
   * Busca o 'id_usuario' (bigint) na tabela 'Usuario' (singular)
   * usando a coluna 'auth_id' (uuid).
   */
  private async getInternalUserId(authUuid: string): Promise<number> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('usuario')
      .select('id_usuario') // <-- COLUNA CORRETA (O bigint PK que queremos)
      .eq('auth_id', authUuid) // <-- COLUNA CORRETA (Confirmada por você)
      .single();

    if (error || !data) {
      // Este erro agora só deve ocorrer se o usuário logado (auth_id)
      // realmente não tiver um registro correspondente na tabela 'Usuario'.
      throw new UnauthorizedException(
        `Falha na sincronização do usuário. O usuário (auth: ${authUuid}) não foi encontrado no registro local 'Usuario'.`,
      );
    }

    return data.id_usuario;
  }

  /**
   * O parâmetro final 'auth_uuid' é o 'sub' (string UUID) vindo do controller.
   */
  async create(dto: CreateDadoZootecnicoDto, id_bufalo: string, auth_uuid: string) {
    // 1. TRADUZIR: Buscar o ID numérico (bigint) usando o Auth UUID (string)
    const internalUserId = await this.getInternalUserId(auth_uuid);

    // 2. INSERIR: Agora usamos o ID numérico correto (internalUserId) no insert
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .insert({
        ...dto,
        id_bufalo: id_bufalo,
        id_usuario: internalUserId, // <-- Inserindo o BIGINT correto
        dt_registro: dto.dt_registro || new Date(),
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao criar dado zootécnico: ${error.message}`);
    }
    return formatDateFields(data);
  }

  async findAllByBufalo(id_bufalo: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    // Contar total de registros para este búfalo
    const { count, error: countError } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id_bufalo', id_bufalo)
      .is('deleted_at', null);

    if (countError) {
      throw new InternalServerErrorException(`Falha ao contar dados do búfalo: ${countError.message}`);
    }

    // Buscar registros com paginação
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .eq('id_bufalo', id_bufalo)
      .is('deleted_at', null)
      .order('dt_registro', { ascending: false })
      .range(offset, offset + limitValue - 1);

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar dados do búfalo: ${error.message}`);
    }

    const formattedData = formatDateFieldsArray(data);
    return createPaginatedResponse(formattedData, count || 0, page, limitValue);
  }

  async findAllByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    // Primeiro, busca o total de registros para a propriedade (através do JOIN com búfalos)
    const { count, error: countError } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('id_zootec, bufalo!inner(id_propriedade)', { count: 'exact', head: true })
      .eq('bufalo.id_propriedade', id_propriedade)
      .is('deleted_at', null);

    if (countError) {
      throw new InternalServerErrorException(`Falha ao contar dados zootécnicos da propriedade: ${countError.message}`);
    }

    // Buscar registros com informações do búfalo
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select(
        `
        *,
        bufalo:id_bufalo(id_bufalo, nome, brinco, id_propriedade)
      `,
      )
      .eq('bufalo.id_propriedade', id_propriedade)
      .is('deleted_at', null)
      .order('dt_registro', { ascending: false })
      .range(offset, offset + limitValue - 1);

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar dados zootécnicos da propriedade: ${error.message}`);
    }

    const formattedData = formatDateFieldsArray(data);
    return createPaginatedResponse(formattedData, count || 0, page, limitValue);
  }

  async findOne(id_zootec: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .eq('id_zootec', id_zootec)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Dado zootécnico com ID ${id_zootec} não encontrado.`);
    }
    return formatDateFields(data);
  }

  async update(id_zootec: string, dto: UpdateDadoZootecnicoDto) {
    await this.findOne(id_zootec); // Garante que o registro existe

    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).update(dto).eq('id_zootec', id_zootec).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar dado zootécnico: ${error.message}`);
    }
    return formatDateFields(data);
  }

  async remove(id_zootec: string) {
    return this.softDelete(id_zootec);
  }

  async softDelete(id: string) {
    await this.findOne(id);

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id_zootec', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover dado zootécnico: ${error.message}`);
    }

    return {
      message: 'Registro removido com sucesso (soft delete)',
      data: formatDateFields(data),
    };
  }

  async restore(id: string) {
    const { data: registro } = await this.supabase.getAdminClient().from(this.tableName).select('deleted_at').eq('id_zootec', id).single();

    if (!registro) {
      throw new NotFoundException(`Dado zootécnico com ID ${id} não encontrado`);
    }

    if (!registro.deleted_at) {
      throw new BadRequestException('Este registro não está removido');
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .update({ deleted_at: null })
      .eq('id_zootec', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao restaurar dado zootécnico: ${error.message}`);
    }

    return {
      message: 'Registro restaurado com sucesso',
      data: formatDateFields(data),
    };
  }

  async findAllWithDeleted(): Promise<any[]> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .order('deleted_at', { ascending: false, nullsFirst: true })
      .order('dt_registro', { ascending: false });

    if (error) {
      throw new InternalServerErrorException('Erro ao buscar dados zootécnicos (incluindo deletados)');
    }

    return formatDateFieldsArray(data || []);
  }
}
