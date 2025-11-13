import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { AlertasService } from '../../alerta/alerta.service';
import { NichoAlerta, PrioridadeAlerta } from '../../alerta/dto/create-alerta.dto';
import { CreateCicloLactacaoDto } from './dto/create-ciclo-lactacao.dto';
import { UpdateCicloLactacaoDto } from './dto/update-ciclo-lactacao.dto';
import { PaginationDto, PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { ISoftDelete } from '../../../core/interfaces/soft-delete.interface';

@Injectable()
export class CicloLactacaoService implements ISoftDelete {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: LoggerService,
    private readonly alertasService: AlertasService,
  ) {}

  private readonly tableName = 'ciclolactacao';

  /**
   * Calcula dias em lactação
   */
  private calcularDiasEmLactacao(dt_parto: string, dt_secagem_real?: string | null): number {
    const dataFim = dt_secagem_real ? new Date(dt_secagem_real) : new Date();
    const dataInicio = new Date(dt_parto);
    const diffTime = Math.abs(dataFim.getTime() - dataInicio.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private computeSecagemPrevista(dt_parto: string, padrao_dias: number): string {
    const baseDate = new Date(dt_parto);
    const result = new Date(baseDate);
    result.setDate(result.getDate() + padrao_dias);
    return result.toISOString().slice(0, 10);
  }

  private computeStatus(dt_secagem_real?: string | null): string {
    return dt_secagem_real ? 'Seca' : 'Em Lactação';
  }

  /**
   * Verifica se deve criar alertas para o ciclo
   */
  private async verificarAlertasCiclo(ciclo: any, bufalaData: any) {
    try {
      const diasEmLactacao = this.calcularDiasEmLactacao(ciclo.dt_parto, ciclo.dt_secagem_real);

      await this.verificarCicloProlongado(ciclo, bufalaData, diasEmLactacao);
      await this.verificarProximaSecagem(ciclo, bufalaData);
      await this.verificarSecagemAtrasada(ciclo, bufalaData);
      await this.verificarCicloCurto(ciclo, bufalaData, diasEmLactacao);
    } catch (error) {
      this.logger.logError(error, {
        module: 'CicloLactacaoService',
        method: 'verificarAlertasCiclo',
        cicloId: ciclo.id_ciclo_lactacao,
      });
    }
  }

  private async verificarCicloProlongado(ciclo: any, bufalaData: any, diasEmLactacao: number) {
    if (!ciclo.dt_secagem_real && diasEmLactacao > 365) {
      await this.criarAlertaProducao({
        animal_id: ciclo.id_bufala,
        bufalaData,
        id_propriedade: ciclo.id_propriedade,
        motivo: `Búfala em lactação há ${diasEmLactacao} dias - Ciclo prolongado`,
        prioridade: PrioridadeAlerta.MEDIA,
        observacao: 'Avaliar condição corporal e considerar secagem.',
        id_evento_origem: ciclo.id_ciclo_lactacao,
        tipo_evento_origem: 'CICLO_PROLONGADO',
      });
    }
  }

  private async verificarProximaSecagem(ciclo: any, bufalaData: any) {
    if (!ciclo.dt_secagem_real && ciclo.dt_secagem_prevista) {
      const dataSecagemPrev = new Date(ciclo.dt_secagem_prevista);
      const hoje = new Date();
      const diasParaSecagem = Math.ceil((dataSecagemPrev.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

      if (diasParaSecagem <= 15 && diasParaSecagem >= 0) {
        await this.criarAlertaProducao({
          animal_id: ciclo.id_bufala,
          bufalaData,
          id_propriedade: ciclo.id_propriedade,
          motivo: `Secagem prevista em ${diasParaSecagem} dias (${ciclo.dt_secagem_prevista})`,
          prioridade: diasParaSecagem <= 7 ? PrioridadeAlerta.ALTA : PrioridadeAlerta.MEDIA,
          observacao: 'Planejar protocolo de secagem e preparar animal.',
          id_evento_origem: ciclo.id_ciclo_lactacao,
          tipo_evento_origem: 'PROXIMA_SECAGEM',
        });
      }
    }
  }

  private async verificarSecagemAtrasada(ciclo: any, bufalaData: any) {
    if (!ciclo.dt_secagem_real && ciclo.dt_secagem_prevista) {
      const dataSecagemPrev = new Date(ciclo.dt_secagem_prevista);
      const hoje = new Date();
      const diasAtraso = Math.ceil((hoje.getTime() - dataSecagemPrev.getTime()) / (1000 * 60 * 60 * 24));

      if (diasAtraso > 0) {
        await this.criarAlertaProducao({
          animal_id: ciclo.id_bufala,
          bufalaData,
          id_propriedade: ciclo.id_propriedade,
          motivo: `Secagem atrasada há ${diasAtraso} dias - Data prevista: ${ciclo.dt_secagem_prevista}`,
          prioridade: diasAtraso > 30 ? PrioridadeAlerta.ALTA : PrioridadeAlerta.MEDIA,
          observacao: 'Realizar secagem urgente para preservar saúde do úbere.',
          id_evento_origem: ciclo.id_ciclo_lactacao,
          tipo_evento_origem: 'SECAGEM_ATRASADA',
        });
      }
    }
  }

  private async verificarCicloCurto(ciclo: any, bufalaData: any, diasEmLactacao: number) {
    if (ciclo.dt_secagem_real && diasEmLactacao < 200) {
      await this.criarAlertaProducao({
        animal_id: ciclo.id_bufala,
        bufalaData,
        id_propriedade: ciclo.id_propriedade,
        motivo: `Ciclo muito curto: apenas ${diasEmLactacao} dias`,
        prioridade: PrioridadeAlerta.MEDIA,
        observacao: 'Investigar causas da lactação curta (saúde, nutrição, manejo).',
        id_evento_origem: ciclo.id_ciclo_lactacao,
        tipo_evento_origem: 'CICLO_CURTO',
      });
    }
  }

  /**
   * Cria um alerta de produção
   */
  private async criarAlertaProducao(params: {
    animal_id: string;
    bufalaData: any;
    id_propriedade: string;
    motivo: string;
    prioridade: PrioridadeAlerta;
    observacao: string;
    id_evento_origem: string;
    tipo_evento_origem: string;
  }) {
    try {
      let grupoNome = 'Não informado';
      if (params.bufalaData.id_grupo) {
        const { data: grupoData } = await this.supabase
          .getAdminClient()
          .from('grupo')
          .select('nome_grupo')
          .eq('id_grupo', params.bufalaData.id_grupo)
          .single();
        if (grupoData) grupoNome = grupoData.nome_grupo;
      }

      let propriedadeNome = 'Não informada';
      if (params.id_propriedade) {
        const { data: propData } = await this.supabase
          .getAdminClient()
          .from('propriedade')
          .select('nome')
          .eq('id_propriedade', params.id_propriedade)
          .single();
        if (propData) propriedadeNome = propData.nome;
      }

      await this.alertasService.createIfNotExists({
        animal_id: params.animal_id,
        grupo: grupoNome,
        localizacao: propriedadeNome,
        id_propriedade: params.id_propriedade,
        motivo: params.motivo,
        nicho: NichoAlerta.PRODUCAO,
        data_alerta: new Date().toISOString().split('T')[0],
        prioridade: params.prioridade,
        observacao: params.observacao,
        id_evento_origem: params.id_evento_origem,
        tipo_evento_origem: params.tipo_evento_origem,
      });
    } catch (error) {
      this.logger.logError(error, {
        module: 'CicloLactacaoService',
        method: 'criarAlertaProducao',
      });
    }
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
      .getAdminClient()
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

    // Buscar dados da búfala para verificar alertas
    const { data: bufalaData } = await this.supabase
      .getAdminClient()
      .from('bufalo')
      .select('id_bufalo, nome, id_grupo')
      .eq('id_bufalo', dto.id_bufala)
      .single();

    if (bufalaData) {
      await this.verificarAlertasCiclo(data, bufalaData);
    }

    this.logger.log('Ciclo de lactação criado com sucesso', {
      module: 'CicloLactacaoService',
      method: 'create',
      cicloId: data.id_ciclo_lactacao,
      bufalaId: dto.id_bufala,
    });
    return formatDateFields(data);
  }

  async findAll(paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    this.logger.log('Iniciando busca de todos os ciclos de lactação com paginação', {
      module: 'CicloLactacaoService',
      method: 'findAll',
    });

    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    // Contar total de registros (excluindo deletados)
    const { count, error: countError } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (countError) {
      this.logger.logError(countError, {
        module: 'CicloLactacaoService',
        method: 'findAll',
      });
      throw new InternalServerErrorException(`Falha ao contar ciclos de lactação: ${countError.message}`);
    }

    // Buscar registros com paginação (excluindo deletados)
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .is('deleted_at', null)
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

    const formattedData = formatDateFieldsArray(data);
    return createPaginatedResponse(formattedData, count || 0, page, limitValue);
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    this.logger.log('Iniciando busca de ciclos por propriedade', {
      module: 'CicloLactacaoService',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });

    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    const { count, error: countError } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id_propriedade', id_propriedade);

    if (countError) {
      this.logger.logError(countError, {
        module: 'CicloLactacaoService',
        method: 'findByPropriedade',
      });
      throw new InternalServerErrorException(`Falha ao contar ciclos da propriedade: ${countError.message}`);
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select(
        `
        *,
        bufala:id_bufala(nome, brinco)
      `,
      )
      .eq('id_propriedade', id_propriedade)
      .order('dt_parto', { ascending: false })
      .range(offset, offset + limitValue - 1);

    if (error) {
      this.logger.logError(error, {
        module: 'CicloLactacaoService',
        method: 'findByPropriedade',
      });
      throw new InternalServerErrorException(`Falha ao buscar ciclos da propriedade: ${error.message}`);
    }

    // Transformar a resposta para aplanar os dados da búfala
    const enrichedData = data.map((ciclo: any) => ({
      ...ciclo,
      bufala_nome: ciclo.bufala?.nome || null,
      bufala_brinco: ciclo.bufala?.brinco || null,
      bufala: undefined, // remover o objeto aninhado
    }));

    this.logger.log(`Busca concluída - ${data.length} ciclos encontrados (página ${page})`, {
      module: 'CicloLactacaoService',
      method: 'findByPropriedade',
    });

    const formattedData = formatDateFieldsArray(enrichedData);
    return createPaginatedResponse(formattedData, count || 0, page, limitValue);
  }

  async findOne(id_ciclo_lactacao: string) {
    this.logger.log('Iniciando busca de ciclo de lactação por ID', {
      module: 'CicloLactacaoService',
      method: 'findOne',
      cicloId: id_ciclo_lactacao,
    });

    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).select('*').eq('id_ciclo_lactacao', id_ciclo_lactacao).single();

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
    return formatDateFields(data);
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
      .getAdminClient()
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

    // Verificar alertas após atualização
    const { data: bufalaData } = await this.supabase
      .getAdminClient()
      .from('bufalo')
      .select('id_bufalo, nome, id_grupo')
      .eq('id_bufalo', data.id_bufala)
      .single();

    if (bufalaData) {
      await this.verificarAlertasCiclo(data, bufalaData);
    }

    this.logger.log('Ciclo de lactação atualizado com sucesso', {
      module: 'CicloLactacaoService',
      method: 'update',
      cicloId: id_ciclo_lactacao,
    });
    return formatDateFields(data);
  }

  async remove(id_ciclo_lactacao: string) {
    return this.softDelete(id_ciclo_lactacao);
  }

  async softDelete(id: string) {
    this.logger.log('Iniciando remoção de ciclo de lactação (soft delete)', {
      module: 'CicloLactacaoService',
      method: 'softDelete',
      cicloId: id,
    });

    await this.findOne(id);

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id_ciclo_lactacao', id)
      .select()
      .single();

    if (error) {
      this.logger.logError(error, {
        module: 'CicloLactacaoService',
        method: 'softDelete',
        cicloId: id,
      });
      throw new InternalServerErrorException(`Falha ao remover ciclo de lactação: ${error.message}`);
    }

    this.logger.log('Ciclo de lactação removido com sucesso (soft delete)', {
      module: 'CicloLactacaoService',
      method: 'softDelete',
      cicloId: id,
    });

    return {
      message: 'Ciclo de lactação removido com sucesso (soft delete)',
      data: formatDateFields(data),
    };
  }

  async restore(id: string) {
    this.logger.log('Iniciando restauração de ciclo de lactação', {
      module: 'CicloLactacaoService',
      method: 'restore',
      cicloId: id,
    });

    const { data: ciclo } = await this.supabase.getAdminClient().from(this.tableName).select('deleted_at').eq('id_ciclo_lactacao', id).single();

    if (!ciclo) {
      throw new NotFoundException(`Ciclo de lactação com ID ${id} não encontrado`);
    }

    if (!ciclo.deleted_at) {
      throw new BadRequestException('Este ciclo de lactação não está removido');
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .update({ deleted_at: null })
      .eq('id_ciclo_lactacao', id)
      .select()
      .single();

    if (error) {
      this.logger.logError(error, {
        module: 'CicloLactacaoService',
        method: 'restore',
        cicloId: id,
      });
      throw new InternalServerErrorException(`Falha ao restaurar ciclo de lactação: ${error.message}`);
    }

    this.logger.log('Ciclo de lactação restaurado com sucesso', {
      module: 'CicloLactacaoService',
      method: 'restore',
      cicloId: id,
    });

    return {
      message: 'Ciclo de lactação restaurado com sucesso',
      data: formatDateFields(data),
    };
  }

  async findAllWithDeleted(): Promise<any[]> {
    this.logger.log('Buscando todos os ciclos de lactação incluindo deletados', {
      module: 'CicloLactacaoService',
      method: 'findAllWithDeleted',
    });

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .order('deleted_at', { ascending: false, nullsFirst: true })
      .order('dt_parto', { ascending: false });

    if (error) {
      this.logger.logError(error, {
        module: 'CicloLactacaoService',
        method: 'findAllWithDeleted',
      });
      throw new InternalServerErrorException('Erro ao buscar ciclos de lactação (incluindo deletados)');
    }

    return formatDateFieldsArray(data || []);
  }

  /**
   * Retorna estatísticas gerais de ciclos de lactação por propriedade
   */
  async getEstatisticasPropriedade(id_propriedade: string) {
    this.logger.log('Buscando estatísticas de ciclos por propriedade', {
      module: 'CicloLactacaoService',
      method: 'getEstatisticasPropriedade',
      propriedadeId: id_propriedade,
    });

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('id_ciclo_lactacao, dt_parto, dt_secagem_real, dt_secagem_prevista, status, padrao_dias')
      .eq('id_propriedade', id_propriedade);

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar estatísticas: ${error.message}`);
    }

    const totalCiclos = data.length;
    const ciclosAtivos = data.filter((c) => c.status === 'Em Lactação').length;
    const ciclosSecos = data.filter((c) => c.status === 'Seca').length;

    // Calcular média de dias em lactação dos ciclos ativos
    const ciclosAtivosComDias = data.filter((c) => c.status === 'Em Lactação').map((c) => this.calcularDiasEmLactacao(c.dt_parto));

    const mediaDiasLactacao =
      ciclosAtivosComDias.length > 0 ? Math.round(ciclosAtivosComDias.reduce((a, b) => a + b, 0) / ciclosAtivosComDias.length) : 0;

    // Ciclos próximos da secagem (próximos 30 dias)
    const hoje = new Date();
    const ciclosProximosSecagem = data.filter((c) => {
      if (c.status !== 'Em Lactação' || !c.dt_secagem_prevista) return false;
      const dataSecagem = new Date(c.dt_secagem_prevista);
      const diasParaSecagem = Math.ceil((dataSecagem.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      return diasParaSecagem >= 0 && diasParaSecagem <= 30;
    }).length;

    // Ciclos com secagem atrasada
    const ciclosSecagemAtrasada = data.filter((c) => {
      if (c.status !== 'Em Lactação' || !c.dt_secagem_prevista) return false;
      const dataSecagem = new Date(c.dt_secagem_prevista);
      return hoje > dataSecagem;
    }).length;

    return {
      total_ciclos: totalCiclos,
      ciclos_ativos: ciclosAtivos,
      ciclos_secos: ciclosSecos,
      media_dias_lactacao: mediaDiasLactacao,
      ciclos_proximos_secagem: ciclosProximosSecagem,
      ciclos_secagem_atrasada: ciclosSecagemAtrasada,
    };
  }
}
