import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { CreateRelatorioDto, TipoRelatorio } from './dto/create-relatorio.dto';
import { aplicarFiltros } from './utils/filter';
// 1. Importa a nova função utilitária para gerar o PDF
import { gerarTabelaPdf } from './utils/pdf-generator';

interface ColunaDef {
  header: string;
  key: string;
}

@Injectable()
export class RelatorioService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async gerarRelatorioPdf(dto: CreateRelatorioDto): Promise<Buffer> {
    let dados: any[];
    let titulo: string;
    let colunas: ColunaDef[];

    switch (dto.template) {
      case TipoRelatorio.REBANHO:
        titulo = 'Relatório de Rebanho';
        colunas = [
          { header: 'Brinco', key: 'brinco' },
          { header: 'Nome', key: 'nome' },
          { header: 'Raça', key: 'raca' },
          { header: 'Sexo', key: 'sexo' },
          { header: 'Nascimento', key: 'nascimento' },
          { header: 'Pai (Brinco)', key: 'pai' },
          { header: 'Mãe (Brinco)', key: 'mae' },
        ];
        dados = await this.obterDadosRebanho(dto);
        break;
      // ... Outros cases para LACTACAO e REPRODUCAO podem ser adicionados aqui
      default:
        throw new NotFoundException('Tipo de relatório não suportado');
    }

    if (!dados || dados.length === 0) {
      throw new NotFoundException(
        'Nenhum dado encontrado para os filtros aplicados. Verifique se os búfalos existem e se as datas de nascimento estão dentro do período especificado.',
      );
    }

    // 2. Chama a função externa para gerar o PDF, em vez do método interno
    return gerarTabelaPdf(titulo, colunas, dados);
  }

  private async obterDadosRebanho(dto: CreateRelatorioDto): Promise<any[]> {
    const query = this.supabaseService
      .getClient()
      .from('relatorio_rebanho')
      .select('*')
      .order('brinco');

    aplicarFiltros(query, dto, {
      idPropriedade: 'id_propriedade',
      idBufalo: 'id_bufalo',
      data: 'dt_nascimento',
    });

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao consultar a view de rebanho:', error);
      throw new InternalServerErrorException(
        `Erro ao consultar o banco de dados: ${error.message}`,
      );
    }

    return data.map((item: any) => ({
      brinco: item.brinco || '-',
      nome: item.nome || '-',
      raca: item.raca_nome || '-',
      sexo: item.sexo || '-',
      nascimento: item.dt_nascimento
        ? new Date(item.dt_nascimento).toLocaleDateString('pt-BR')
        : '-',
      pai: item.pai_brinco || '-',
      mae: item.mae_brinco || '-',
    }));
  }

}

