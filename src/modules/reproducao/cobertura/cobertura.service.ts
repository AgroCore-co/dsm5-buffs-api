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

@Injectable()
export class CoberturaService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly alertasService: AlertasService,
    private readonly validator: CoberturaValidator,
  ) {}

  private readonly tableName = 'dadosreproducao';

  async create(dto: CreateCoberturaDto, auth_uuid: string) {
    // Validações de regras de negócio
    if (dto.id_bufala && dto.dt_evento) {
      // Validar fêmea
      await this.validator.validarAnimalAtivo(dto.id_bufala);
      await this.validator.validarGestacaoDuplicada(dto.id_bufala, dto.dt_evento);
      await this.validator.validarIdadeMinimaReproducao(dto.id_bufala, 'F');
      await this.validator.validarIdadeMaximaReproducao(dto.id_bufala, 'F');
      await this.validator.validarIntervaloEntrePartos(dto.id_bufala, dto.dt_evento);
    }

    // Don't include id_usuario - it doesn't exist in dadosreproducao table
    const dtoComStatus = {
      ...dto,
      status: dto.status || 'Em andamento',
    };

    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).insert(dtoComStatus).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao criar dado de reprodução: ${error.message}`);
    }
    return formatDateFields(data);
  }

  async findAll(paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    // Contar total de registros
    const { count, error: countError } = await this.supabase.getAdminClient().from(this.tableName).select('*', { count: 'exact', head: true });

    if (countError) {
      throw new InternalServerErrorException(`Falha ao contar dados de reprodução: ${countError.message}`);
    }

    // Buscar registros com paginação
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .order('dt_evento', { ascending: false })
      .range(offset, offset + limitValue - 1);

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar dados de reprodução: ${error.message}`);
    }

    const formattedData = formatDateFieldsArray(data);
    return createPaginatedResponse(formattedData, count || 0, page, limitValue);
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    const { count, error: countError } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id_propriedade', id_propriedade);

    if (countError) {
      throw new InternalServerErrorException(`Falha ao contar dados de reprodução da propriedade: ${countError.message}`);
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .eq('id_propriedade', id_propriedade)
      .order('dt_evento', { ascending: false })
      .range(offset, offset + limitValue - 1);

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar dados de reprodução da propriedade: ${error.message}`);
    }

    const formattedData = formatDateFieldsArray(data);
    return createPaginatedResponse(formattedData, count || 0, page, limitValue);
  }

  async findOne(id_repro: string) {
    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).select('*').eq('id_reproducao', id_repro).single();

    if (error || !data) {
      throw new NotFoundException(`Dado de reprodução com ID ${id_repro} não encontrado.`);
    }
    return formatDateFields(data);
  }

  async update(id_repro: string, dto: UpdateCoberturaDto) {
    await this.findOne(id_repro);

    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).update(dto).eq('id_reproducao', id_repro).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar dado de reprodução: ${error.message}`);
    }
    return formatDateFields(data);
  }

  async remove(id_repro: string) {
    await this.findOne(id_repro);

    const { error } = await this.supabase.getAdminClient().from(this.tableName).delete().eq('id_reproducao', id_repro);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover dado de reprodução: ${error.message}`);
    }
    return { message: 'Registro removido com sucesso' };
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

    // 2. Atualizar cobertura com dados do parto
    const { data: coberturaAtualizada, error: updateError } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .update({
        tipo_parto: dto.tipo_parto,
        status: 'Concluída',
      })
      .eq('id_reproducao', id_repro)
      .select()
      .single();

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
      cobertura: coberturaAtualizada,
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
