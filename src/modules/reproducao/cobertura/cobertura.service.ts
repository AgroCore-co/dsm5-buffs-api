import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateCoberturaDto } from './dto/create-cobertura.dto';
import { UpdateCoberturaDto } from './dto/update-cobertura.dto';
import { PaginationDto, PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { FemeaDisponivelReproducaoDto } from './dto/femea-disponivel-reproducao.dto';
import { RegistrarPartoDto } from './dto/registrar-parto.dto';
import { AlertasService } from '../../alerta/alerta.service';
import { NichoAlerta, PrioridadeAlerta } from '../../alerta/dto/create-alerta.dto';
import { RecomendacaoFemeaDto, RecomendacaoMachoDto, MotivoScore } from './dto/recomendacao-acasalamento.dto';
import { CoberturaValidator } from './validators/cobertura.validator';
import { ISoftDelete } from '../../../core/interfaces/soft-delete.interface';
import {
  calcularIAR,
  calcularFPProntidao,
  calcularFPIdade,
  calcularFPHistorico,
  calcularFPLactacao,
  gerarMotivosIAR,
  type FatoresPonderacao,
} from './utils/calcular-iar.util';
import { calcularIVR, calcularMediaRebanho, gerarMotivosIVR, type DadosIVR } from './utils/calcular-ivr.util';
import {
  buscarCicloAtivo,
  contarCiclosTotais,
  calcularIEPMedio,
  buscarHistoricoCoberturasTouro,
  estatisticasRebanho,
} from './utils/reproducao-queries.util';
import { calcularIdadeEmMeses, determinarStatusFemea } from './utils/reproducao-helpers.util';
import { CoberturaRepository } from './repositories/cobertura.repository';
import { mapCoberturaResponse, mapCoberturasResponse } from './mappers/cobertura.mapper';

@Injectable()
export class CoberturaService implements ISoftDelete {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly alertasService: AlertasService,
    private readonly validator: CoberturaValidator,
    private readonly coberturaRepo: CoberturaRepository,
  ) {}

  private readonly tableName = 'dadosreproducao';

  async create(dto: CreateCoberturaDto, auth_uuid: string) {
    // ============================================================
    // 1. VALIDAR CONSISTÊNCIA DOS CAMPOS POR TIPO DE INSEMINAÇÃO
    // ============================================================
    if (dto.tipo_inseminacao === 'Monta Natural') {
      if (!dto.id_bufalo) {
        throw new BadRequestException('Monta Natural requer id_bufalo (macho reprodutor)');
      }
      if (dto.id_semen) {
        throw new BadRequestException('Monta Natural não deve ter id_semen');
      }
      if (dto.id_doadora) {
        throw new BadRequestException('Monta Natural não deve ter id_doadora');
      }
    }

    if (dto.tipo_inseminacao === 'IA' || dto.tipo_inseminacao === 'IATF') {
      if (!dto.id_semen) {
        const tipoNome = dto.tipo_inseminacao === 'IA' ? 'IA (Inseminação Artificial)' : 'IATF (Inseminação Artificial em Tempo Fixo)';
        throw new BadRequestException(`${tipoNome} requer id_semen (material genético)`);
      }
      if (dto.id_doadora) {
        throw new BadRequestException('IA e IATF não devem ter id_doadora (apenas TE usa doadora)');
      }
    }

    if (dto.tipo_inseminacao === 'TE') {
      if (!dto.id_semen) {
        throw new BadRequestException('TE (Transferência de Embrião) requer id_semen (embrião)');
      }
      if (!dto.id_doadora) {
        throw new BadRequestException('TE (Transferência de Embrião) requer id_doadora (búfala doadora do óvulo)');
      }
    }

    // ============================================================
    // 2. VALIDAR FÊMEA RECEPTORA
    // ============================================================
    if (dto.id_bufala && dto.dt_evento) {
      await this.validator.validarAnimalAtivo(dto.id_bufala);
      await this.validator.validarGestacaoDuplicada(dto.id_bufala, dto.dt_evento);
      await this.validator.validarIdadeMinimaReproducao(dto.id_bufala, 'F');
      await this.validator.validarIdadeMaximaReproducao(dto.id_bufala, 'F');
      await this.validator.validarIntervaloEntrePartos(dto.id_bufala, dto.dt_evento);
    }

    // ============================================================
    // 3. VALIDAR MACHO REPRODUTOR (se Monta Natural)
    // ============================================================
    if (dto.id_bufalo) {
      await this.validator.validarAnimalAtivo(dto.id_bufalo);
      await this.validator.validarIdadeMinimaReproducao(dto.id_bufalo, 'M');
      await this.validator.validarIdadeMaximaReproducao(dto.id_bufalo, 'M');
      await this.validator.validarIntervaloUsoMacho(dto.id_bufalo, dto.dt_evento);

      // Verificar que é realmente macho
      const { data: macho, error: erroMacho } = await this.supabase
        .getAdminClient()
        .from('bufalo')
        .select('sexo, nome')
        .eq('id_bufalo', dto.id_bufalo)
        .single();

      if (erroMacho || !macho) {
        throw new BadRequestException(`Reprodutor não encontrado: ${dto.id_bufalo}`);
      }

      if (macho.sexo !== 'M') {
        throw new BadRequestException(`Animal "${macho.nome}" não é macho. Para Monta Natural, id_bufalo deve ser um búfalo macho.`);
      }
    }

    // ============================================================
    // 4. VALIDAR BÚFALA DOADORA (se TE - Transferência de Embrião)
    // ============================================================
    if (dto.id_doadora) {
      await this.validator.validarAnimalAtivo(dto.id_doadora);
      await this.validator.validarIdadeMinimaReproducao(dto.id_doadora, 'F');
      await this.validator.validarIdadeMaximaReproducao(dto.id_doadora, 'F');

      // Verificar que é realmente fêmea
      const { data: doadora, error: erroDoadora } = await this.supabase
        .getAdminClient()
        .from('bufalo')
        .select('sexo, nome')
        .eq('id_bufalo', dto.id_doadora)
        .single();

      if (erroDoadora || !doadora) {
        throw new BadRequestException(`Doadora não encontrada: ${dto.id_doadora}`);
      }

      if (doadora.sexo !== 'F') {
        throw new BadRequestException(`Animal "${doadora.nome}" não é fêmea. Para TE, id_doadora deve ser uma búfala fêmea.`);
      }
    }

    // ============================================================
    // 5. VALIDAR MATERIAL GENÉTICO (se IA, IATF ou TE)
    // ============================================================
    if (dto.id_semen) {
      const { data: semen, error: erroSemen } = await this.supabase
        .getAdminClient()
        .from('materialgenetico')
        .select('id_material, tipo, ativo')
        .eq('id_material', dto.id_semen)
        .single();

      if (erroSemen || !semen) {
        throw new BadRequestException(`Material genético não encontrado: ${dto.id_semen}`);
      }

      if (!semen.ativo) {
        throw new BadRequestException(`Material genético está inativo e não pode ser utilizado`);
      }

      // Validar tipo de material conforme técnica (IA e IATF usam Sêmen)
      if ((dto.tipo_inseminacao === 'IA' || dto.tipo_inseminacao === 'IATF') && semen.tipo !== 'Sêmen') {
        throw new BadRequestException('IA e IATF requerem material genético do tipo "Sêmen"');
      }

      // TE usa Embrião
      if (dto.tipo_inseminacao === 'TE' && semen.tipo !== 'Embrião') {
        throw new BadRequestException('TE (Transferência de Embrião) requer material genético do tipo "Embrião"');
      }
    }

    // ============================================================
    // 6. INSERIR NO BANCO
    // ============================================================
    const dtoComStatus = {
      ...dto,
      status: dto.status || 'Em andamento',
    };

    const { data, error } = await this.coberturaRepo.create(dtoComStatus);

    if (error) {
      throw new InternalServerErrorException(`Falha ao criar dado de reprodução: ${error.message}`);
    }

    // Buscar novamente com joins para retornar dados completos
    const { data: coberturaCompleta, error: errorBusca } = await this.coberturaRepo.findById(data.id_reproducao);

    if (errorBusca || !coberturaCompleta) {
      // Se falhar ao buscar com joins, retorna o dado básico
      return formatDateFields(data);
    }

    // Mapear dados para incluir informações dos animais
    const mappedData = mapCoberturaResponse(coberturaCompleta);
    return formatDateFields(mappedData);
  }

  async findAll(paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    // Contar total de registros (excluindo deletados)
    const { count, error: countError } = await this.coberturaRepo.count(false);

    if (countError) {
      throw new InternalServerErrorException(`Falha ao contar dados de reprodução: ${countError.message}`);
    }

    // Buscar registros com paginação (excluindo deletados)
    const { data, error } = await this.coberturaRepo.findAll({ offset, limit: limitValue }, false);

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar dados de reprodução: ${error.message}`);
    }

    // Mapear dados para incluir informações dos animais
    const mappedData = mapCoberturasResponse(data);
    const formattedData = formatDateFieldsArray(mappedData);
    return createPaginatedResponse(formattedData, count || 0, page, limitValue);
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    // Contar total de registros da propriedade
    const { count, error: countError } = await this.coberturaRepo.countByPropriedade(id_propriedade);

    if (countError) {
      throw new InternalServerErrorException(`Falha ao contar dados de reprodução da propriedade: ${countError.message}`);
    }

    // Buscar registros da propriedade com paginação
    const { data, error } = await this.coberturaRepo.findByPropriedade(id_propriedade, { offset, limit: limitValue });

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar dados de reprodução da propriedade: ${error.message}`);
    }

    // Mapear dados para incluir informações dos animais
    const mappedData = mapCoberturasResponse(data);
    const formattedData = formatDateFieldsArray(mappedData);
    return createPaginatedResponse(formattedData, count || 0, page, limitValue);
  }

  async findOne(id_repro: string) {
    const { data, error } = await this.coberturaRepo.findById(id_repro);

    if (error || !data) {
      throw new NotFoundException(`Dado de reprodução com ID ${id_repro} não encontrado.`);
    }

    // Mapear dados para incluir informações dos animais
    const mappedData = mapCoberturaResponse(data);
    return formatDateFields(mappedData);
  }

  async update(id_repro: string, dto: UpdateCoberturaDto) {
    const cobertura = await this.findOne(id_repro);

    // Validar se pode atualizar tipo_parto
    if (dto.tipo_parto && cobertura.status !== 'Confirmada') {
      throw new BadRequestException(
        'Apenas coberturas com status "Confirmada" podem ter tipo_parto atualizado. Use o endpoint de registrar parto para finalizar o processo.',
      );
    }

    const { data, error } = await this.coberturaRepo.update(id_repro, dto);

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar dado de reprodução: ${error.message}`);
    }

    // Mapear dados para incluir informações dos animais
    const mappedData = mapCoberturaResponse(data);
    return formatDateFields(mappedData);
  }

  async remove(id_repro: string) {
    return this.softDelete(id_repro);
  }

  async softDelete(id: string) {
    await this.findOne(id);

    const { data, error } = await this.coberturaRepo.softDelete(id);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover dado de reprodução: ${error.message}`);
    }

    return {
      message: 'Registro removido com sucesso (soft delete)',
      data: formatDateFields(data),
    };
  }

  async restore(id: string) {
    const { data: cobertura } = await this.coberturaRepo.findByIdSimple(id);

    if (!cobertura) {
      throw new NotFoundException(`Registro de reprodução com ID ${id} não encontrado`);
    }

    if (!cobertura.deleted_at) {
      throw new BadRequestException('Este registro não está removido');
    }

    const { data, error } = await this.coberturaRepo.restore(id);

    if (error) {
      throw new InternalServerErrorException(`Falha ao restaurar dado de reprodução: ${error.message}`);
    }

    return {
      message: 'Registro restaurado com sucesso',
      data: formatDateFields(data),
    };
  }

  async findAllWithDeleted(): Promise<any[]> {
    const { data, error } = await this.coberturaRepo.findAllWithDeleted();

    if (error) {
      throw new InternalServerErrorException('Erro ao buscar dados de reprodução (incluindo deletados)');
    }

    // Mapear dados para incluir informações dos animais
    const mappedData = mapCoberturasResponse(data || []);
    return formatDateFieldsArray(mappedData);
  }

  /**
   * Busca fêmeas disponíveis para reprodução
   */
  async findFemeasDisponiveisReproducao(
    id_propriedade: string,
    filtro: 'todas' | 'solteiras' | 'vazias' | 'aptas' = 'aptas',
  ): Promise<FemeaDisponivelReproducaoDto[]> {
    // 1. Buscar todas as fêmeas ativas da propriedade com idade reprodutiva (18+ meses)
    const idadeMinimaReproducao = new Date();
    idadeMinimaReproducao.setMonth(idadeMinimaReproducao.getMonth() - 18);

    const { data: femeas, error: femeasError } = await this.supabase
      .getAdminClient()
      .from('bufalo')
      .select('id_bufalo, nome, brinco, dt_nascimento, id_raca')
      .eq('id_propriedade', id_propriedade)
      .eq('sexo', 'F')
      .eq('status', true)
      .lte('dt_nascimento', idadeMinimaReproducao.toISOString());

    if (femeasError) {
      throw new InternalServerErrorException(`Erro ao buscar fêmeas: ${femeasError.message}`);
    }

    if (!femeas || femeas.length === 0) {
      return [];
    }

    const resultado: FemeaDisponivelReproducaoDto[] = [];

    for (const femea of femeas) {
      // 2. Buscar última cobertura
      const { data: coberturas } = await this.supabase
        .getAdminClient()
        .from('dadosreproducao')
        .select('dt_evento, status')
        .eq('id_bufala', femea.id_bufalo)
        .order('dt_evento', { ascending: false })
        .limit(1);

      const ultimaCobertura = coberturas?.[0] || null;
      const dtUltimaCobertura = ultimaCobertura?.dt_evento || null;
      const diasDesdeCobertura = dtUltimaCobertura
        ? Math.floor((new Date().getTime() - new Date(dtUltimaCobertura).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // 3. Buscar ciclo de lactação ativo
      const { data: cicloAtivo } = await this.supabase
        .getAdminClient()
        .from('ciclolactacao')
        .select('id_ciclo_lactacao, dt_parto, status')
        .eq('id_bufala', femea.id_bufalo)
        .eq('status', 'Em Lactação')
        .single();

      let diasEmLactacao = 0;
      let numeroCiclo = 0;
      if (cicloAtivo) {
        diasEmLactacao = Math.floor((new Date().getTime() - new Date(cicloAtivo.dt_parto).getTime()) / (1000 * 60 * 60 * 24));
        const { count } = await this.supabase
          .getAdminClient()
          .from('ciclolactacao')
          .select('*', { count: 'exact', head: true })
          .eq('id_bufala', femea.id_bufalo);
        numeroCiclo = count || 0;
      }

      // 4. Determinar status reprodutivo
      let statusReprodutivo = 'Disponível';
      const recomendacoes: string[] = [];

      // Período pós-parto mínimo: 45 dias
      if (cicloAtivo && diasEmLactacao < 45) {
        statusReprodutivo = 'Período Pós-Parto';
        recomendacoes.push(`Aguardar mais ${45 - diasEmLactacao} dias antes de cobrir (período pós-parto)`);
      }

      // Cobertura recente aguardando diagnóstico (30-90 dias)
      if (ultimaCobertura?.status === 'Em andamento' && diasDesdeCobertura && diasDesdeCobertura >= 30 && diasDesdeCobertura <= 90) {
        statusReprodutivo = 'Aguardando Diagnóstico';
        recomendacoes.push('Realizar diagnóstico de prenhez');
      }

      // Filtrar baseado no tipo solicitado
      const incluir =
        filtro === 'todas' ||
        (filtro === 'solteiras' && !ultimaCobertura) ||
        (filtro === 'vazias' && ultimaCobertura?.status === 'Falhou') ||
        (filtro === 'aptas' && statusReprodutivo === 'Disponível');

      if (!incluir) continue;

      // 5. Buscar raça
      let nomeRaca = 'Sem raça definida';
      if (femea.id_raca) {
        const { data: raca } = await this.supabase.getAdminClient().from('raca').select('nome').eq('id_raca', femea.id_raca).single();
        if (raca) nomeRaca = raca.nome;
      }

      // 6. Calcular idade
      const idadeMeses = femea.dt_nascimento
        ? Math.floor((new Date().getTime() - new Date(femea.dt_nascimento).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
        : 0;

      // Recomendações adicionais
      if (statusReprodutivo === 'Disponível') {
        if (cicloAtivo && diasEmLactacao >= 60 && diasEmLactacao <= 120) {
          recomendacoes.push('Período ideal para cobertura pós-parto (60-120 dias)');
        }
        if (!cicloAtivo && !ultimaCobertura) {
          recomendacoes.push('Primeira cobertura - verificar cio antes de proceder');
        }
      }

      resultado.push({
        id_bufalo: femea.id_bufalo,
        nome: femea.nome,
        brinco: femea.brinco || 'Sem brinco',
        idade_meses: idadeMeses,
        raca: nomeRaca,
        ultima_cobertura: dtUltimaCobertura,
        dias_desde_ultima_cobertura: diasDesdeCobertura,
        status_reprodutivo: statusReprodutivo,
        ciclo_atual: cicloAtivo
          ? {
              numero_ciclo: numeroCiclo,
              dias_em_lactacao: diasEmLactacao,
              status: cicloAtivo.status,
            }
          : null,
        recomendacoes,
      });
    }

    return resultado;
  }

  /**
   * Registra parto e cria ciclo de lactação automaticamente
   */
  async registrarParto(id_repro: string, dto: RegistrarPartoDto) {
    // 1. Buscar cobertura
    const cobertura = await this.findOne(id_repro);

    if (cobertura.status !== 'Confirmada') {
      throw new BadRequestException('Apenas coberturas confirmadas (prenhez confirmada) podem ter parto registrado.');
    }

    // 2. Atualizar cobertura com dados do parto usando repository
    const { data: coberturaAtualizada, error: updateError } = await this.coberturaRepo.update(id_repro, {
      tipo_parto: dto.tipo_parto,
      status: 'Concluída',
    });

    if (updateError) {
      throw new InternalServerErrorException(`Falha ao atualizar cobertura: ${updateError.message}`);
    }

    let cicloLactacao = null;

    // 3. Criar ciclo de lactação automaticamente (apenas para partos normais e cesárea)
    if (dto.criar_ciclo_lactacao !== false && (dto.tipo_parto === 'Normal' || dto.tipo_parto === 'Cesárea')) {
      const { data: ciclo, error: cicloError } = await this.supabase
        .getAdminClient()
        .from('ciclolactacao')
        .insert({
          id_bufala: cobertura.id_bufala,
          id_propriedade: cobertura.id_propriedade,
          dt_parto: dto.dt_parto,
          padrao_dias: dto.padrao_dias_lactacao || 305,
          observacao: dto.observacao || `Ciclo criado automaticamente a partir do parto registrado em ${new Date().toLocaleDateString()}`,
        })
        .select()
        .single();

      if (cicloError) {
        console.warn('Erro ao criar ciclo de lactação:', cicloError.message);
      } else {
        cicloLactacao = ciclo;

        // 4. CRIAR ALERTA AUTOMÁTICO PARA SECAGEM (60 dias antes do previsto)
        try {
          const dtParto = new Date(dto.dt_parto);
          const padrãoDias = dto.padrao_dias_lactacao || 305;
          const dtSecagemPrevista = new Date(dtParto);
          dtSecagemPrevista.setDate(dtParto.getDate() + padrãoDias);

          // Alerta 60 dias antes da secagem prevista
          const dtAlertaSecagem = new Date(dtSecagemPrevista);
          dtAlertaSecagem.setDate(dtSecagemPrevista.getDate() - 60);

          // Buscar informações da búfala para o alerta
          const { data: bufalaData } = await this.supabase
            .getAdminClient()
            .from('bufalo')
            .select('id_bufalo, nome, id_grupo, id_propriedade')
            .eq('id_bufalo', cobertura.id_bufala)
            .single();

          if (bufalaData) {
            // Buscar nome do grupo
            let grupoNome = 'Não informado';
            if (bufalaData.id_grupo) {
              const { data: grupoData } = await this.supabase
                .getAdminClient()
                .from('grupo')
                .select('nome_grupo')
                .eq('id_grupo', bufalaData.id_grupo)
                .single();
              if (grupoData) {
                grupoNome = grupoData.nome_grupo;
              }
            }

            // Buscar nome da propriedade
            let propriedadeNome = 'Não informada';
            const propriedadeId = cobertura.id_propriedade || bufalaData.id_propriedade;
            if (propriedadeId) {
              const { data: propData } = await this.supabase
                .getAdminClient()
                .from('propriedade')
                .select('nome')
                .eq('id_propriedade', propriedadeId)
                .single();
              if (propData) {
                propriedadeNome = propData.nome;
              }
            }

            // Criar alerta
            await this.alertasService.createIfNotExists({
              animal_id: bufalaData.id_bufalo,
              grupo: grupoNome,
              localizacao: propriedadeNome,
              id_propriedade: propriedadeId,
              motivo: `Preparar para secagem da búfala ${bufalaData.nome}. Lactação prevista até ${dtSecagemPrevista.toLocaleDateString('pt-BR')}.`,
              nicho: NichoAlerta.MANEJO,
              data_alerta: dtAlertaSecagem.toISOString().split('T')[0],
              prioridade: PrioridadeAlerta.MEDIA,
              observacao: `Ciclo iniciado em ${dtParto.toLocaleDateString('pt-BR')}. Duração padrão: ${padrãoDias} dias. Iniciar protocolo de secagem 60 dias antes.`,
              id_evento_origem: ciclo.id_ciclo_lactacao,
              tipo_evento_origem: 'CICLO_LACTACAO',
            });

            console.log(`✅ Alerta de secagem criado automaticamente para ${bufalaData.nome}`);
          }
        } catch (alertaError) {
          // Não bloqueia o fluxo se o alerta falhar
          console.error('⚠️ Erro ao criar alerta de secagem:', alertaError);
        }
      }
    }

    return {
      cobertura: mapCoberturaResponse(coberturaAtualizada),
      ciclo_lactacao: cicloLactacao,
      message: cicloLactacao ? 'Parto registrado, ciclo de lactação criado e alerta de secagem agendado com sucesso' : 'Parto registrado com sucesso',
    };
  }

  /**
   * Retorna recomendações ranqueadas de fêmeas para acasalamento
   * Baseado no Índice de Aptidão Reprodutiva (IAR)
   *
   * IAR = (FP_Prontidao * 0.50) + (FP_Idade * 0.15) + (FP_Historico * 0.20) + (FP_Lactacao * 0.15)
   *
   * Fatores:
   * - FP_Prontidao (50%): Prontidão fisiológica baseada em DPP ou idade (novilha)
   * - FP_Idade (15%): Janela de idade produtiva
   * - FP_Historico (20%): Eficiência reprodutiva histórica (IEP médio)
   * - FP_Lactacao (15%): Modulador de lactação (penaliza pico)
   */
  async findRecomendacoesFemeas(id_propriedade: string, limit?: number): Promise<RecomendacaoFemeaDto[]> {
    // 1. Buscar todas as fêmeas ativas da propriedade com idade mínima reprodutiva (18 meses)
    const idadeMinimaReproducao = new Date();
    idadeMinimaReproducao.setMonth(idadeMinimaReproducao.getMonth() - 18);

    const { data: femeas, error: femeasError } = await this.supabase
      .getAdminClient()
      .from('bufalo')
      .select(
        `
        id_bufalo,
        nome,
        brinco,
        dt_nascimento,
        id_raca,
        raca:id_raca(nome)
      `,
      )
      .eq('id_propriedade', id_propriedade)
      .eq('sexo', 'F')
      .eq('status', true)
      .lte('dt_nascimento', idadeMinimaReproducao.toISOString());

    if (femeasError) {
      throw new InternalServerErrorException(`Erro ao buscar fêmeas: ${femeasError.message}`);
    }

    if (!femeas || femeas.length === 0) {
      return [];
    }

    const recomendacoes: RecomendacaoFemeaDto[] = [];

    for (const femea of femeas) {
      // 2. Calcular idade em meses
      const idadeMeses = calcularIdadeEmMeses(femea.dt_nascimento);

      // 3. Buscar ciclo de lactação ativo (mais recente)
      const cicloAtivo = await buscarCicloAtivo(this.supabase.getAdminClient(), femea.id_bufalo);

      // 4. Contar total de ciclos (número de partos)
      const totalCiclos = await contarCiclosTotais(this.supabase.getAdminClient(), femea.id_bufalo);

      // 5. Calcular dias pós-parto (DPP)
      let diasPosParto: number | null = null;
      let diasEmLactacao: number | null = null;
      let statusLactacao = 'Seca';

      if (cicloAtivo) {
        diasPosParto = Math.floor((Date.now() - new Date(cicloAtivo.dt_parto).getTime()) / (1000 * 60 * 60 * 24));

        if (cicloAtivo.status === 'Em Lactação') {
          diasEmLactacao = diasPosParto;
          statusLactacao = 'Em Lactação';
        }
      }

      // 6. Calcular IEP médio (se >= 2 partos)
      const iepMedio = await calcularIEPMedio(this.supabase.getAdminClient(), femea.id_bufalo, totalCiclos);

      // 7. Calcular fatores do IAR
      const fp_prontidao = calcularFPProntidao(totalCiclos, idadeMeses, diasPosParto);
      const fp_idade = calcularFPIdade(idadeMeses, totalCiclos);
      const fp_historico = calcularFPHistorico(totalCiclos, iepMedio);
      const fp_lactacao = calcularFPLactacao(statusLactacao, diasEmLactacao);

      // 8. Calcular IAR final
      const fatores: FatoresPonderacao = {
        fp_prontidao,
        fp_idade,
        fp_historico,
        fp_lactacao,
      };

      const score = calcularIAR(fatores);

      // 9. Gerar motivos
      const motivosTexto = gerarMotivosIAR(fatores, totalCiclos, diasPosParto, idadeMeses, iepMedio, diasEmLactacao);
      const motivos: MotivoScore[] = motivosTexto.map((descricao) => ({ descricao }));

      // 10. Determinar status reprodutivo
      const status = determinarStatusFemea(fp_prontidao, totalCiclos, diasPosParto);

      // 11. Montar resposta
      const recomendacao: RecomendacaoFemeaDto = {
        id_bufalo: femea.id_bufalo,
        nome: femea.nome,
        brinco: femea.brinco || 'S/N',
        idade_meses: idadeMeses,
        raca: (femea.raca as any)?.nome || 'Não informada',
        dados_reprodutivos: {
          status,
          dias_pos_parto: diasPosParto,
          dias_em_lactacao: diasEmLactacao,
          numero_ciclos: totalCiclos,
          iep_medio_dias: iepMedio,
        },
        score,
        motivos,
      };

      recomendacoes.push(recomendacao);
    }

    // Ordenar por score decrescente
    const recomendacoesOrdenadas = recomendacoes.sort((a, b) => b.score - a.score);

    // Aplicar limite se especificado
    return limit ? recomendacoesOrdenadas.slice(0, limit) : recomendacoesOrdenadas;
  }

  /**
   * Retorna recomendações ranqueadas de machos para acasalamento
   * Baseado no Índice de Valor Reprodutivo (IVR)
   *
   * IVR usa Taxa de Concepção Ajustada (TCA) com Regressão Bayesiana:
   * TCA = ((N * TCB) + (K * MR)) / (N + K)
   *
   * Onde:
   * - N = número de coberturas do touro
   * - TCB = Taxa de Concepção Bruta do touro
   * - K = fator de confiabilidade (20)
   * - MR = Média do Rebanho (taxa de concepção média da propriedade)
   *
   * Usa tipo_parto como indicador de sucesso (Normal/Cesárea = prenhez confirmada)
   */
  async findRecomendacoesMachos(id_propriedade: string, limit?: number): Promise<RecomendacaoMachoDto[]> {
    // 1. Calcular média do rebanho (MR_TC) - estatística global da propriedade
    const { totalPrenhezes, totalCoberturas } = await estatisticasRebanho(this.supabase.getAdminClient(), id_propriedade);
    const mr_tc = calcularMediaRebanho(totalPrenhezes, totalCoberturas);

    // 2. Buscar todos os machos ativos da propriedade com idade mínima reprodutiva (24 meses)
    const idadeMinimaReproducao = new Date();
    idadeMinimaReproducao.setMonth(idadeMinimaReproducao.getMonth() - 24);

    const { data: machos, error: machosError } = await this.supabase
      .getAdminClient()
      .from('bufalo')
      .select(
        `
        id_bufalo,
        nome,
        brinco,
        dt_nascimento,
        categoria,
        id_raca,
        raca:id_raca(nome)
      `,
      )
      .eq('id_propriedade', id_propriedade)
      .eq('sexo', 'M')
      .eq('status', true)
      .lte('dt_nascimento', idadeMinimaReproducao.toISOString());

    if (machosError) {
      throw new InternalServerErrorException(`Erro ao buscar machos: ${machosError.message}`);
    }

    if (!machos || machos.length === 0) {
      return [];
    }

    const recomendacoes: RecomendacaoMachoDto[] = [];

    for (const macho of machos) {
      // 3. Calcular idade em meses
      const idadeMeses = calcularIdadeEmMeses(macho.dt_nascimento);

      // 4. Buscar histórico de coberturas do touro
      const historico = await buscarHistoricoCoberturasTouro(this.supabase.getAdminClient(), macho.id_bufalo);

      const n_touro = historico.total_coberturas;
      const totalPrenhezes = historico.total_prenhezes;
      const tcb_touro = n_touro > 0 ? (totalPrenhezes / n_touro) * 100 : 0;

      // 5. Calcular IVR usando regressão bayesiana
      const dadosIVR: DadosIVR = {
        n_touro,
        tcb_touro,
        mr_tc,
      };

      const resultado = calcularIVR(dadosIVR);

      // 6. Gerar motivos (justificativas)
      const motivosTexto = gerarMotivosIVR(resultado, n_touro, tcb_touro);
      const motivos: MotivoScore[] = motivosTexto.map((descricao) => ({ descricao }));

      // 7. Montar resposta
      const recomendacao: RecomendacaoMachoDto = {
        id_bufalo: macho.id_bufalo,
        nome: macho.nome,
        brinco: macho.brinco || 'S/N',
        idade_meses: idadeMeses,
        raca: (macho.raca as any)?.nome || 'Não informada',
        categoria_abcb: macho.categoria || null,
        dados_reprodutivos: {
          total_coberturas: n_touro,
          total_prenhezes: totalPrenhezes,
          taxa_concepcao_bruta: tcb_touro,
          taxa_concepcao_ajustada: resultado.tca,
          confiabilidade: resultado.confiabilidade,
          ultima_cobertura: historico.ultima_cobertura,
          dias_desde_ultima_cobertura: historico.dias_desde_ultima,
        },
        score: resultado.score,
        motivos,
      };

      recomendacoes.push(recomendacao);
    }

    // Ordenar por score decrescente
    const recomendacoesOrdenadas = recomendacoes.sort((a, b) => b.score - a.score);

    // Aplicar limite se especificado
    return limit ? recomendacoesOrdenadas.slice(0, limit) : recomendacoesOrdenadas;
  }
}
