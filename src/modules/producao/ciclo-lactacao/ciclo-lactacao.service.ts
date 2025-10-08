import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateCicloLactacaoDto } from './dto/create-ciclo-lactacao.dto';
import { UpdateCicloLactacaoDto } from './dto/update-ciclo-lactacao.dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';

@Injectable()
export class CicloLactacaoService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

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
    this.logger.log('Iniciando criação de ciclo de lactação', {
      module: 'CicloLactacaoService',
      method: 'create',
      bufalaId: dto.id_bufala,
      dtParto: dto.dt_parto,
    });

    const dt_secagem_prevista = this.computeSecagemPrevista(dto.dt_parto, dto.padrao_dias);
    const status = this.computeStatus(dto.dt_secagem_real);

    this.logger.log('Calculando datas e status do ciclo', {
      module: 'CicloLactacaoService',
      method: 'create',
      dtSecagemPrevista: dt_secagem_prevista,
      status,
    });

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
      this.logger.logError(error, {
        module: 'CicloLactacaoService',
        method: 'create',
        bufalaId: dto.id_bufala,
      });
      throw new InternalServerErrorException(`Falha ao criar ciclo de lactação: ${error.message}`);
    }

    this.logger.log('Ciclo de lactação criado com sucesso', {
      module: 'CicloLactacaoService',
      method: 'create',
      cicloId: data.id_ciclo_lactacao,
      bufalaId: dto.id_bufala,
    });
    return data;
  }

  async findAll(paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    this.logger.log('Iniciando busca de todos os ciclos de lactação com paginação', {
      module: 'CicloLactacaoService',
      method: 'findAll',
    });

    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    // Contar total de registros
    const { count, error: countError } = await this.supabase.getClient().from(this.tableName).select('*', { count: 'exact', head: true });

    if (countError) {
      this.logger.logError(countError, {
        module: 'CicloLactacaoService',
        method: 'findAll',
      });
      throw new InternalServerErrorException(`Falha ao contar ciclos de lactação: ${countError.message}`);
    }

    // Buscar registros com paginação
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*, bufala:Bufalo(nome)')
      .order('dt_parto', { ascending: false })
      .range(offset, offset + limitValue - 1);

    if (error) {
      this.logger.logError(error, {
        module: 'CicloLactacaoService',
        method: 'findAll',
      });
      throw new InternalServerErrorException(`Falha ao buscar ciclos de lactação: ${error.message}`);
    }

    this.logger.log(`Busca de ciclos de lactação concluída - ${data.length} ciclos encontrados (página ${page})`, {
      module: 'CicloLactacaoService',
      method: 'findAll',
    });

    return createPaginatedResponse(data, count || 0, page, limitValue);
  }

  async findOne(id_ciclo_lactacao: string) {
    this.logger.log('Iniciando busca de ciclo de lactação por ID', {
      module: 'CicloLactacaoService',
      method: 'findOne',
      cicloId: id_ciclo_lactacao,
    });

    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*, bufala:Bufalo(nome)')
      .eq('id_ciclo_lactacao', id_ciclo_lactacao)
      .single();

    if (error || !data) {
      this.logger.warn('Ciclo de lactação não encontrado', {
        module: 'CicloLactacaoService',
        method: 'findOne',
        cicloId: id_ciclo_lactacao,
      });
      throw new NotFoundException(`Ciclo de lactação com ID ${id_ciclo_lactacao} não encontrado.`);
    }

    this.logger.log('Ciclo de lactação encontrado com sucesso', {
      module: 'CicloLactacaoService',
      method: 'findOne',
      cicloId: id_ciclo_lactacao,
    });
    return data;
  }

  async update(id_ciclo_lactacao: string, dto: UpdateCicloLactacaoDto) {
    this.logger.log('Iniciando atualização de ciclo de lactação', {
      module: 'CicloLactacaoService',
      method: 'update',
      cicloId: id_ciclo_lactacao,
    });

    const current = await this.findOne(id_ciclo_lactacao);

    const dt_parto = dto.dt_parto ?? current.dt_parto;
    const padrao_dias = dto.padrao_dias ?? current.padrao_dias;
    const dt_secagem_prevista = this.computeSecagemPrevista(dt_parto, padrao_dias);
    const status = this.computeStatus(dto.dt_secagem_real ?? current.dt_secagem_real);

    this.logger.log('Recalculando datas e status do ciclo', {
      module: 'CicloLactacaoService',
      method: 'update',
      cicloId: id_ciclo_lactacao,
      dtSecagemPrevista: dt_secagem_prevista,
      status,
    });

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
      this.logger.logError(error, {
        module: 'CicloLactacaoService',
        method: 'update',
        cicloId: id_ciclo_lactacao,
      });
      throw new InternalServerErrorException(`Falha ao atualizar ciclo de lactação: ${error.message}`);
    }

    this.logger.log('Ciclo de lactação atualizado com sucesso', {
      module: 'CicloLactacaoService',
      method: 'update',
      cicloId: id_ciclo_lactacao,
    });
    return data;
  }

  async remove(id_ciclo_lactacao: string) {
    this.logger.log('Iniciando remoção de ciclo de lactação', {
      module: 'CicloLactacaoService',
      method: 'remove',
      cicloId: id_ciclo_lactacao,
    });

    await this.findOne(id_ciclo_lactacao);

    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_ciclo_lactacao', id_ciclo_lactacao);

    if (error) {
      this.logger.logError(error, {
        module: 'CicloLactacaoService',
        method: 'remove',
        cicloId: id_ciclo_lactacao,
      });
      throw new InternalServerErrorException(`Falha ao remover ciclo de lactação: ${error.message}`);
    }

    this.logger.log('Ciclo de lactação removido com sucesso', {
      module: 'CicloLactacaoService',
      method: 'remove',
      cicloId: id_ciclo_lactacao,
    });
    return { message: 'Ciclo removido com sucesso' };
  }
}
