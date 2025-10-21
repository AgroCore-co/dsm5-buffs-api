import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

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
}
