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
    const supabase = this.supabaseService.getClient();

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

      // Busca estatísticas dos búfalos
      const { data: bufalosStats, error: bufalosError } = await supabase
        .from('bufalo')
        .select('sexo, nivel_maturidade, status')
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

      const stats: DashboardStatsDto = {
        qtd_macho_ativos: bufalosAtivos.filter((b) => b.sexo === 'M').length,
        qtd_femeas_ativas: bufalosAtivos.filter((b) => b.sexo === 'F').length,
        qtd_bufalos_registradas: bufalos.length,
        qtd_bufalos_bezerro: bufalos.filter((b) => b.nivel_maturidade === 'B').length,
        qtd_bufalos_novilha: bufalos.filter((b) => b.nivel_maturidade === 'N').length,
        qtd_bufalos_vaca: bufalos.filter((b) => b.nivel_maturidade === 'V').length,
        qtd_bufalos_touro: bufalos.filter((b) => b.nivel_maturidade === 'T').length,
        qtd_bufalas_lactando: bufalasLactando?.length || 0,
        qtd_lotes: qtdLotes || 0,
        qtd_usuarios: qtdUsuarios || 0,
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
