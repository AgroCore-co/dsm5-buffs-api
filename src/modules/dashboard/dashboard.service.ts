import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { LoggerService } from '../../core/logger/logger.service';
import {
  DashboardStatsDto,
  DashboardLactacaoDto,
  CicloLactacaoMetricaDto,
  DashboardProducaoMensalDto,
  ProducaoMensalItemDto,
  DashboardReproducaoDto,
} from './dto';
import { formatToSimpleDate } from '../../core/utils/date-formatter.utils';

@Injectable()
export class DashboardService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Retorna estatísticas do dashboard para uma propriedade específica
   */
  async getStats(id_propriedade: string): Promise<DashboardStatsDto> {
    const supabase = this.supabaseService.getAdminClient();

    try {
      // Verifica se a propriedade existe
      const { data: propriedadeExists, error: propError } = await supabase
        .from('propriedade')
        .select('id_propriedade')
        .eq('id_propriedade', id_propriedade)
        .single();

      if (propError || !propriedadeExists) {
        throw new NotFoundException(`Propriedade com ID ${id_propriedade} não encontrada.`);
      }

      // Busca estatísticas dos búfalos com informação da raça
      const { data: bufalosStats, error: bufalosError } = await supabase
        .from('bufalo')
        .select('sexo, nivel_maturidade, status, id_raca, raca:id_raca(nome)')
        .eq('id_propriedade', id_propriedade);

      if (bufalosError) {
        this.logger.logError(bufalosError, { module: 'Dashboard', method: 'getStats', context: 'bufalos', id_propriedade });
        throw new InternalServerErrorException(`Erro ao buscar dados dos búfalos: ${bufalosError.message}`);
      }

      // Busca búfalas em lactação
      const { data: bufalasLactando, error: lactacaoError } = await supabase
        .from('ciclolactacao')
        .select('id_bufala')
        .eq('id_propriedade', id_propriedade)
        .eq('status', 'Em Lactação');

      if (lactacaoError) {
        this.logger.logError(lactacaoError, { module: 'Dashboard', method: 'getStats', context: 'lactacao', id_propriedade });
        throw new InternalServerErrorException(`Erro ao buscar dados de lactação: ${lactacaoError.message}`);
      }

      // Busca quantidade de lotes
      const { count: qtdLotes, error: lotesError } = await supabase
        .from('lote')
        .select('*', { count: 'exact', head: true })
        .eq('id_propriedade', id_propriedade);

      if (lotesError) {
        this.logger.logError(lotesError, { module: 'Dashboard', method: 'getStats', context: 'lotes', id_propriedade });
        throw new InternalServerErrorException(`Erro ao buscar dados dos lotes: ${lotesError.message}`);
      }

      // Busca quantidade de usuários vinculados à propriedade
      const { count: qtdUsuarios, error: usuariosError } = await supabase
        .from('usuariopropriedade')
        .select('*', { count: 'exact', head: true })
        .eq('id_propriedade', id_propriedade);

      if (usuariosError) {
        this.logger.logError(usuariosError, { module: 'Dashboard', method: 'getStats', context: 'usuarios', id_propriedade });
        throw new InternalServerErrorException(`Erro ao buscar dados dos usuários: ${usuariosError.message}`);
      }

      // Processa as estatísticas
      const bufalos = bufalosStats || [];
      const bufalosAtivos = bufalos.filter((b) => b.status === true);

      // Processa búfalos por raça (APENAS ATIVOS)
      const racaMap = new Map<string, number>();

      bufalosAtivos.forEach((bufalo: any) => {
        const nomeRaca = bufalo.raca?.nome || 'Sem Raça';
        racaMap.set(nomeRaca, (racaMap.get(nomeRaca) || 0) + 1);
      });

      const bufalosPorRaca = Array.from(racaMap.entries())
        .map(([raca, quantidade]) => ({ raca, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade); // Ordena por quantidade decrescente

      const stats: DashboardStatsDto = {
        qtd_macho_ativos: bufalosAtivos.filter((b) => b.sexo === 'M').length,
        qtd_femeas_ativas: bufalosAtivos.filter((b) => b.sexo === 'F').length,
        qtd_bufalos_registradas: bufalos.length, // TODOS (ativos + inativos)
        qtd_bufalos_bezerro: bufalosAtivos.filter((b) => b.nivel_maturidade === 'B').length, // ← SOMENTE ATIVOS
        qtd_bufalos_novilha: bufalosAtivos.filter((b) => b.nivel_maturidade === 'N').length, // ← SOMENTE ATIVOS
        qtd_bufalos_vaca: bufalosAtivos.filter((b) => b.nivel_maturidade === 'V').length, // ← SOMENTE ATIVOS
        qtd_bufalos_touro: bufalosAtivos.filter((b) => b.nivel_maturidade === 'T').length, // ← SOMENTE ATIVOS
        qtd_bufalas_lactando: bufalasLactando?.length || 0,
        qtd_lotes: qtdLotes || 0,
        qtd_usuarios: qtdUsuarios || 0,
        bufalosPorRaca,
      };

      return stats;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.logError(error, { module: 'Dashboard', method: 'getStats', id_propriedade });
      throw new InternalServerErrorException(`Erro inesperado ao gerar estatísticas: ${error.message}`);
    }
  }

  /**
   * Retorna métricas de lactação por ciclo de uma propriedade em um ano específico
   */
  async getLactacaoMetricas(id_propriedade: string, ano: number): Promise<DashboardLactacaoDto> {
    const supabase = this.supabaseService.getAdminClient();

    try {
      // Verifica se a propriedade existe
      const { data: propriedadeExists, error: propError } = await supabase
        .from('propriedade')
        .select('id_propriedade')
        .eq('id_propriedade', id_propriedade)
        .single();

      if (propError || !propriedadeExists) {
        throw new NotFoundException(`Propriedade com ID ${id_propriedade} não encontrada.`);
      }

      // Busca ciclos de lactação da propriedade no ano especificado
      const { data: ciclosRaw, error: fetchError } = await supabase
        .from('ciclolactacao')
        .select(
          `
          id_ciclo_lactacao,
          id_bufala,
          dt_parto,
          dt_secagem_real,
          bufalo:id_bufala(nome, sexo),
          dadoslactacao(qt_ordenha)
        `,
        )
        .eq('id_propriedade', id_propriedade)
        .not('dt_secagem_real', 'is', null);

      if (fetchError) {
        this.logger.logError(fetchError, { module: 'Dashboard', method: 'getLactacaoMetricas', id_propriedade, ano });
        throw new InternalServerErrorException(`Erro ao buscar dados de lactação: ${fetchError.message}`);
      }

      // Filtrar apenas fêmeas e do ano especificado
      const ciclosFiltered = (ciclosRaw || []).filter((c: any) => {
        const anoSecagem = new Date(c.dt_secagem_real).getFullYear();
        return c.bufalo?.sexo === 'F' && anoSecagem === ano;
      });

      // Agrupar ciclos por búfala para calcular número do parto
      const ciclosPorBufala = new Map<string, any[]>();
      ciclosFiltered.forEach((ciclo: any) => {
        const id = ciclo.id_bufala;
        if (!ciclosPorBufala.has(id)) {
          ciclosPorBufala.set(id, []);
        }
        ciclosPorBufala.get(id)!.push(ciclo);
      });

      // Processar dados de cada ciclo
      const ciclosProcessados: CicloLactacaoMetricaDto[] = [];

      ciclosPorBufala.forEach((ciclosDaBufala) => {
        ciclosDaBufala.sort((a, b) => new Date(a.dt_parto).getTime() - new Date(b.dt_parto).getTime());

        ciclosDaBufala.forEach((ciclo: any, index: number) => {
          const diasLactacao = Math.floor((new Date(ciclo.dt_secagem_real).getTime() - new Date(ciclo.dt_parto).getTime()) / (1000 * 60 * 60 * 24));

          // Total de leite = soma das ordenhas
          const lactacaoTotal = (ciclo.dadoslactacao || []).reduce((sum: number, d: any) => sum + (d.qt_ordenha || 0), 0);

          // Média diária = total / quantidade de registros (primeiro até último)
          const mediaLactacao = (ciclo.dadoslactacao || []).length > 0 ? lactacaoTotal / (ciclo.dadoslactacao || []).length : 0;

          ciclosProcessados.push({
            id_ciclo_lactacao: ciclo.id_ciclo_lactacao,
            id_bufala: ciclo.id_bufala,
            nome_bufala: ciclo.bufalo?.nome,
            numero_parto: index + 1,
            dt_parto: new Date(ciclo.dt_parto).toISOString().split('T')[0],
            dt_secagem_real: new Date(ciclo.dt_secagem_real).toISOString().split('T')[0],
            dias_em_lactacao: diasLactacao,
            media_lactacao: Math.round(mediaLactacao * 1000) / 1000,
            lactacao_total: Math.round(lactacaoTotal * 1000) / 1000,
            classificacao: '', // Será preenchido abaixo
          });
        });
      });

      // Calcular média do rebanho para o ano (MÉDIA DAS MÉDIAS, não soma/soma)
      const mediaRebanho =
        ciclosProcessados.length > 0 ? ciclosProcessados.reduce((sum, c) => sum + c.lactacao_total, 0) / ciclosProcessados.length : 0;

      // Classificar e ordenar
      const ciclosClassificados = ciclosProcessados
        .map((ciclo: any) => ({
          ...ciclo,
          classificacao:
            ciclo.lactacao_total >= mediaRebanho * 1.2
              ? 'Ótima'
              : ciclo.lactacao_total >= mediaRebanho
                ? 'Boa'
                : ciclo.lactacao_total >= mediaRebanho * 0.8
                  ? 'Mediana'
                  : 'Ruim',
        }))
        .sort((a, b) => {
          const classOrder = { Ótima: 1, Boa: 2, Mediana: 3, Ruim: 4 };
          const classCompare = classOrder[a.classificacao as keyof typeof classOrder] - classOrder[b.classificacao as keyof typeof classOrder];
          return classCompare !== 0 ? classCompare : b.lactacao_total - a.lactacao_total;
        });

      return {
        ano,
        media_rebanho_ano: Math.round(mediaRebanho * 1000) / 1000,
        ciclos: ciclosClassificados,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.logError(error, { module: 'Dashboard', method: 'getLactacaoMetricas', id_propriedade, ano });
      throw new InternalServerErrorException(`Erro inesperado ao gerar métricas de lactação: ${error.message}`);
    }
  }

  /**
   * Retorna métricas de produção mensal de leite de uma propriedade
   */
  async getProducaoMensal(id_propriedade: string, ano?: number): Promise<DashboardProducaoMensalDto> {
    const supabase = this.supabaseService.getAdminClient();
    const anoReferencia = ano || new Date().getFullYear();

    try {
      // Verifica se a propriedade existe
      const { data: propriedadeExists, error: propError } = await supabase
        .from('propriedade')
        .select('id_propriedade')
        .eq('id_propriedade', id_propriedade)
        .single();

      if (propError || !propriedadeExists) {
        throw new NotFoundException(`Propriedade com ID ${id_propriedade} não encontrada.`);
      }

      // Buscar todas as ordenhas do ano
      const dataInicio = `${anoReferencia}-01-01`;
      const dataFim = `${anoReferencia}-12-31`;

      this.logger.log(`Buscando ordenhas para propriedade ${id_propriedade} entre ${dataInicio} e ${dataFim}`, {
        module: 'Dashboard',
        method: 'getProducaoMensal',
        id_propriedade,
        anoReferencia,
      });

      // Verificar dados disponíveis (apenas para debug)
      const { data: todasOrdenhasSemFiltro } = await supabase
        .from('dadoslactacao')
        .select('dt_ordenha, id_propriedade, id_bufala')
        .order('dt_ordenha', { ascending: true })
        .limit(5);

      this.logger.log(`Teste sem filtro de propriedade`, {
        module: 'Dashboard',
        method: 'getProducaoMensal',
        total: todasOrdenhasSemFiltro?.length || 0,
      });

      const { data: todasOrdenhas } = await supabase
        .from('dadoslactacao')
        .select('dt_ordenha, id_propriedade, id_bufala')
        .eq('id_propriedade', id_propriedade)
        .order('dt_ordenha', { ascending: true })
        .limit(5);

      this.logger.log(`Teste com filtro de propriedade`, {
        module: 'Dashboard',
        method: 'getProducaoMensal',
        id_propriedade,
        total: todasOrdenhas?.length || 0,
      });

      if (todasOrdenhas && todasOrdenhas.length > 0) {
        const { data: rangeData } = await supabase
          .from('dadoslactacao')
          .select('dt_ordenha')
          .eq('id_propriedade', id_propriedade)
          .order('dt_ordenha', { ascending: true });

        if (rangeData && rangeData.length > 0) {
          const primeiraData = rangeData[0].dt_ordenha;
          const ultimaData = rangeData[rangeData.length - 1].dt_ordenha;
          this.logger.log(`Dados disponíveis de ${primeiraData} até ${ultimaData} (${rangeData.length} registros)`, {
            module: 'Dashboard',
            method: 'getProducaoMensal',
            id_propriedade,
          });
        }
      }

      const { data: ordenhas, error: ordenhasError } = await supabase
        .from('dadoslactacao')
        .select('dt_ordenha, qt_ordenha, id_bufala')
        .eq('id_propriedade', id_propriedade)
        .gte('dt_ordenha', dataInicio)
        .lte('dt_ordenha', dataFim)
        .order('dt_ordenha', { ascending: true });

      this.logger.log(`Ordenhas encontradas no período`, {
        module: 'Dashboard',
        method: 'getProducaoMensal',
        id_propriedade,
        periodo: `${dataInicio} a ${dataFim}`,
        total: ordenhas?.length || 0,
      });

      if (ordenhasError) {
        this.logger.logError(ordenhasError, {
          module: 'Dashboard',
          method: 'getProducaoMensal',
          context: 'buscar_ordenhas',
          id_propriedade,
        });
        throw new InternalServerErrorException(`Erro ao buscar dados de ordenha: ${ordenhasError.message}`);
      }

      // Agrupar por mês
      const producaoPorMes = new Map<string, { total: number; bufalas: Set<string>; dias: Set<string> }>();

      (ordenhas || []).forEach((ordenha: any) => {
        const mes = ordenha.dt_ordenha.substring(0, 7); // YYYY-MM

        if (!producaoPorMes.has(mes)) {
          producaoPorMes.set(mes, { total: 0, bufalas: new Set(), dias: new Set() });
        }

        const mesData = producaoPorMes.get(mes)!;
        mesData.total += ordenha.qt_ordenha;
        mesData.bufalas.add(ordenha.id_bufala);
        mesData.dias.add(ordenha.dt_ordenha.substring(0, 10)); // YYYY-MM-DD
      });

      this.logger.log(`Meses com produção`, {
        module: 'Dashboard',
        method: 'getProducaoMensal',
        id_propriedade,
        meses: Array.from(producaoPorMes.keys()),
        totais: Array.from(producaoPorMes.entries()).map(([mes, dados]) => ({
          mes,
          total: Math.round(dados.total * 100) / 100,
          bufalas: dados.bufalas.size,
        })),
      });

      // Construir série histórica
      const serieHistorica: ProducaoMensalItemDto[] = [];

      // Determinar o último mês com dados no ano solicitado
      let ultimoMesComDados = 0;
      for (let mes = 1; mes <= 12; mes++) {
        const mesStr = `${anoReferencia}-${mes.toString().padStart(2, '0')}`;
        if (producaoPorMes.has(mesStr)) {
          ultimoMesComDados = mes;
        }
      }

      // Se não há dados, usar mês atual do ano (ou dezembro se for ano passado)
      const hoje = new Date();
      const anoAtual = hoje.getFullYear();
      const mesAtualNumero = hoje.getMonth() + 1; // 1-12

      const mesReferenciaAtual = ultimoMesComDados > 0 ? ultimoMesComDados : anoReferencia === anoAtual ? mesAtualNumero : 12;

      const mesReferenciaAnterior = mesReferenciaAtual > 1 ? mesReferenciaAtual - 1 : 12;

      const mesAtualStr = `${anoReferencia}-${mesReferenciaAtual.toString().padStart(2, '0')}`;
      const mesAnteriorStr =
        mesReferenciaAtual > 1 ? `${anoReferencia}-${mesReferenciaAnterior.toString().padStart(2, '0')}` : `${anoReferencia - 1}-12`;

      this.logger.log(`Referências de meses calculadas`, {
        module: 'Dashboard',
        method: 'getProducaoMensal',
        id_propriedade,
        mesAtual: mesAtualStr,
        mesAnterior: mesAnteriorStr,
      });

      // Preencher todos os 12 meses do ano
      for (let mes = 1; mes <= 12; mes++) {
        const mesStr = `${anoReferencia}-${mes.toString().padStart(2, '0')}`;
        const dados = producaoPorMes.get(mesStr);

        const totalLitros = dados?.total || 0;
        const qtdBufalas = dados?.bufalas.size || 0;
        const diasComOrdenha = dados?.dias.size || 1; // Evitar divisão por zero
        const mediaDiaria = totalLitros / diasComOrdenha;

        serieHistorica.push({
          mes: mesStr,
          total_litros: Math.round(totalLitros * 100) / 100,
          qtd_bufalas: qtdBufalas,
          media_diaria: Math.round(mediaDiaria * 100) / 100,
        });
      }

      // Dados do mês atual (considerando o ano da requisição)
      const dadosMesAtual = producaoPorMes.get(mesAtualStr);
      const mesAtualLitros = dadosMesAtual?.total || 0;
      const bufalasLactantesAtual = dadosMesAtual?.bufalas.size || 0;

      // Dados do mês anterior
      const dadosMesAnterior = producaoPorMes.get(mesAnteriorStr);
      const mesAnteriorLitros = dadosMesAnterior?.total || 0;

      // Calcular variação percentual
      const variacaoPercentual = mesAnteriorLitros > 0 ? ((mesAtualLitros - mesAnteriorLitros) / mesAnteriorLitros) * 100 : 0;

      return {
        ano: anoReferencia,
        mes_atual_litros: Math.round(mesAtualLitros * 100) / 100,
        mes_anterior_litros: Math.round(mesAnteriorLitros * 100) / 100,
        variacao_percentual: Math.round(variacaoPercentual * 100) / 100,
        bufalas_lactantes_atual: bufalasLactantesAtual,
        serie_historica: serieHistorica,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.logError(error, { module: 'Dashboard', method: 'getProducaoMensal', id_propriedade, ano: anoReferencia });
      throw new InternalServerErrorException(`Erro inesperado ao gerar métricas de produção mensal: ${error.message}`);
    }
  }

  /**
   * Retorna estatísticas de reprodução de uma propriedade
   */
  async getReproducaoMetricas(id_propriedade: string): Promise<DashboardReproducaoDto> {
    const supabase = this.supabaseService.getAdminClient();

    try {
      // Verifica se a propriedade existe
      const { data: propriedadeExists, error: propError } = await supabase
        .from('propriedade')
        .select('id_propriedade')
        .eq('id_propriedade', id_propriedade)
        .single();

      if (propError || !propriedadeExists) {
        this.logger.logError(propError, { module: 'Dashboard', method: 'getReproducaoMetricas', id_propriedade });
        throw new NotFoundException(`Propriedade com ID ${id_propriedade} não encontrada`);
      }

      // Busca todas as reproduções da propriedade (ordenadas da mais recente para a mais antiga)
      const { data: reproducoes, error: reproducaoError } = await supabase
        .from('dadosreproducao')
        .select('status, dt_evento')
        .eq('id_propriedade', id_propriedade)
        .order('dt_evento', { ascending: false });

      if (reproducaoError) {
        this.logger.logError(reproducaoError, { module: 'Dashboard', method: 'getReproducaoMetricas', id_propriedade });
        throw new InternalServerErrorException(`Erro ao buscar reproduções: ${reproducaoError.message}`);
      }

      // Contabilizar por status
      const totalEmAndamento = reproducoes?.filter((r) => r.status === 'Em andamento').length || 0;
      const totalConfirmada = reproducoes?.filter((r) => r.status === 'Confirmada').length || 0;
      const totalFalha = reproducoes?.filter((r) => r.status === 'Falha').length || 0;

      // A primeira reprodução é a mais recente (já ordenada DESC)
      const ultimaDataReproducao = reproducoes && reproducoes.length > 0 ? formatToSimpleDate(reproducoes[0].dt_evento) : null;

      return {
        totalEmAndamento,
        totalConfirmada,
        totalFalha,
        ultimaDataReproducao,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.logError(error, { module: 'Dashboard', method: 'getReproducaoMetricas', id_propriedade });
      throw new InternalServerErrorException(`Erro inesperado ao gerar métricas de reprodução: ${error.message}`);
    }
  }
}
