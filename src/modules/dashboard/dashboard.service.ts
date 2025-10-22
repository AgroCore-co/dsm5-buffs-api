import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { DashboardLactacaoDto, CicloLactacaoMetricaDto } from './dto/dashboard-lactacao.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly supabaseService: SupabaseService) {}

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
        throw new InternalServerErrorException(`Erro ao buscar dados dos búfalos: ${bufalosError.message}`);
      }

      // Busca búfalas em lactação
      const { data: bufalasLactando, error: lactacaoError } = await supabase
        .from('ciclolactacao')
        .select('id_bufala')
        .eq('id_propriedade', id_propriedade)
        .eq('status', 'Em Lactação');

      if (lactacaoError) {
        throw new InternalServerErrorException(`Erro ao buscar dados de lactação: ${lactacaoError.message}`);
      }

      // Busca quantidade de lotes
      const { count: qtdLotes, error: lotesError } = await supabase
        .from('lote')
        .select('*', { count: 'exact', head: true })
        .eq('id_propriedade', id_propriedade);

      if (lotesError) {
        throw new InternalServerErrorException(`Erro ao buscar dados dos lotes: ${lotesError.message}`);
      }

      // Busca quantidade de usuários vinculados à propriedade
      const { count: qtdUsuarios, error: usuariosError } = await supabase
        .from('usuariopropriedade')
        .select('*', { count: 'exact', head: true })
        .eq('id_propriedade', id_propriedade);

      if (usuariosError) {
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

          const lactacaoTotal = (ciclo.dadoslactacao || []).reduce((sum: number, d: any) => sum + (d.qt_ordenha || 0), 0);

          const mediaLactacao = diasLactacao > 0 ? lactacaoTotal / diasLactacao : 0;

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

      // Calcular média do rebanho para o ano
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
      throw new InternalServerErrorException(`Erro inesperado ao gerar métricas de lactação: ${error.message}`);
    }
  }
}
