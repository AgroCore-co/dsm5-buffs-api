import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { CreateRelatorioDto, TipoRelatorio } from './dto/create-relatorio.dto';
import { aplicarFiltros } from './utils/filter';
import * as PDFDocument from 'pdfkit';

// Interface para definir a estrutura de uma coluna do relatório
interface ColunaRelatorio {
  cabecalho: string; // O que aparece no PDF
  chave: string;       // A chave do objeto de dados
}

@Injectable()
export class RelatorioService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async gerarRelatorioPdf(dto: CreateRelatorioDto): Promise<Buffer> {
    let dados: any[];
    let titulo: string;
    let colunas: ColunaRelatorio[]; // Usando a nova estrutura

    switch (dto.template) {
      case TipoRelatorio.REBANHO:
        dados = await this.obterDadosRebanho(dto);
        titulo = 'Relatório de Rebanho';
        colunas = [
          { cabecalho: 'Brinco', chave: 'brinco' },
          { cabecalho: 'Nome', chave: 'nome' },
          { cabecalho: 'Raça', chave: 'raca' },
          { cabecalho: 'Sexo', chave: 'sexo' },
          { cabecalho: 'Nascimento', chave: 'nascimento' },
          { cabecalho: 'Pai (Brinco)', chave: 'pai' },
          { cabecalho: 'Mãe (Brinco)', chave: 'mae' },
        ];
        break;

      case TipoRelatorio.REPRODUCAO:
        dados = await this.obterDadosReproducao(dto);
        titulo = 'Relatório de Reprodução';
        colunas = [
          { cabecalho: 'Búfala (Brinco)', chave: 'bufala' },
          { cabecalho: 'Data Cobertura', chave: 'data_cobertura' },
          { cabecalho: 'Touro (Brinco)', chave: 'touro' },
          { cabecalho: 'Diagnóstico', chave: 'diagnostico' },
          { cabecalho: 'Prov. Parto', chave: 'data_parto' },
        ];
        break;

      case TipoRelatorio.LACTACAO:
        dados = await this.obterDadosLactacao(dto);
        titulo = 'Relatório de Lactação';
        colunas = [
          { cabecalho: 'Búfala (Brinco)', chave: 'bufala' },
          { cabecalho: 'Início Lactação', chave: 'inicio' },
          { cabecalho: 'Fim Lactação', chave: 'fim' },
          { cabecalho: 'Produção Total (L)', chave: 'producao' },
        ];
        break;

      default:
        // Este caso é teoricamente impossível devido à validação do DTO, mas é uma boa prática.
        throw new NotFoundException('Tipo de relatório não suportado');
    }

    if (!dados || dados.length === 0) {
      throw new NotFoundException('Nenhum dado encontrado para os filtros aplicados.');
    }

    return this.gerarPdf(titulo, colunas, dados);
  }

  private async obterDadosRebanho(dto: CreateRelatorioDto): Promise<any[]> {
    const query = this.supabaseService
      .getClient()
      .from('Bufalo') // Nome da tabela como no seu banco
      .select(
        `
        brinco,
        nome,
        sexo,
        dt_nascimento,
        Raca(nome),
        pai:Bufalo!id_pai(brinco),
        mae:Bufalo!id_mae(brinco)
      `,
      )
      .order('brinco');

    // Usando a nova função de filtro genérica
    aplicarFiltros(query, dto, {
      idBufaloColumn: 'id_bufalo',
      dateColumn: 'dt_nascimento',
    });

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Mapeamento para um formato simples e consistente
    return data.map((item: any) => ({
      brinco: item.brinco || '-',
      nome: item.nome || '-',
      raca: item.Raca?.nome || '-',
      sexo: item.sexo,
      nascimento: new Date(item.dt_nascimento).toLocaleDateString('pt-BR'),
      pai: item.pai?.brinco || '-',
      mae: item.mae?.brinco || '-',
    }));
  }

  private async obterDadosReproducao(dto: CreateRelatorioDto): Promise<any[]> {
    const query = this.supabaseService
      .getClient()
      .from('DadosReproducao')
      .select(
        `
        dt_evento,
        status,
        bufala:Bufalo!id_bufala(brinco),
        touro:Bufalo!id_bufalo(brinco)
      `,
      )
      .order('dt_evento');

    aplicarFiltros(query, dto, {
      idBufaloColumn: 'id_bufala', // ID da fêmea na reprodução
      dateColumn: 'dt_evento',
    });

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return data.map((item: any) => ({
      bufala: item.bufala?.brinco || '-',
      data_cobertura: new Date(item.dt_evento).toLocaleDateString('pt-BR'),
      touro: item.touro?.brinco || 'N/A',
      diagnostico: item.status || '-',
      data_parto: 'N/A', // Adicionar lógica se tiver data_provavel_parto
    }));
  }

  private async obterDadosLactacao(dto: CreateRelatorioDto): Promise<any[]> {
    const query = this.supabaseService
      .getClient()
      .from('CicloLactacao')
      .select(
        `
        dt_parto,
        dt_secagem_real,
        bufala:Bufalo(brinco)
      `,
      )
      .order('dt_parto');

    aplicarFiltros(query, dto, {
      idBufaloColumn: 'id_bufala',
      dateColumn: 'dt_parto',
    });

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return data.map((item: any) => ({
      bufala: item.bufala?.brinco || '-',
      inicio: new Date(item.dt_parto).toLocaleDateString('pt-BR'),
      fim: item.dt_secagem_real
        ? new Date(item.dt_secagem_real).toLocaleDateString('pt-BR')
        : 'Em Lactação',
      producao: 'N/A', // Produção total precisaria ser calculada ou vir do banco
    }));
  }

  // Corrigido para redesenhar o cabeçalho em novas páginas
  private async gerarPdf(
    titulo: string,
    colunas: ColunaRelatorio[],
    dados: any[],
  ): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({
        margin: 30,
        size: 'A4',
        layout: 'landscape',
      });
      const buffers: any[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // Cabeçalho do Documento
      doc.fontSize(18).font('Helvetica-Bold').text(titulo, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'right' });
      doc.moveDown(2);

      const tableTopInitial = doc.y;
      const rowHeight = 25;
      const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const colWidth = tableWidth / colunas.length;
      
      let currentY = tableTopInitial;

      // -- FUNÇÃO AUXILIAR PARA DESENHAR O CABEÇALHO --
      const drawHeader = (yPosition: number) => {
        doc.font('Helvetica-Bold');
        let currentX = doc.page.margins.left;
        colunas.forEach(({ cabecalho }) => {
          doc.rect(currentX, yPosition, colWidth, rowHeight).stroke();
          doc.text(cabecalho, currentX + 5, yPosition + 7, { width: colWidth - 10, align: 'left' });
          currentX += colWidth;
        });
        doc.font('Helvetica');
      };

      // Desenha o primeiro cabeçalho
      drawHeader(tableTopInitial);
      currentY += rowHeight;

      // Desenhar Linhas de Dados
      dados.forEach((item) => {
        // Checa se há espaço na página, senão, adiciona uma nova e redesenha o cabeçalho
        if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          currentY = doc.page.margins.top;
          drawHeader(currentY); // <<-- A CORREÇÃO CRÍTICA ESTÁ AQUI
          currentY += rowHeight;
        }

        let currentX = doc.page.margins.left;
        colunas.forEach(({ chave }) => {
          doc.rect(currentX, currentY, colWidth, rowHeight).stroke();
          const valor = item[chave] ?? '-';
          doc.text(String(valor), currentX + 5, currentY + 7, { width: colWidth - 10, align: 'left' });
          currentX += colWidth;
        });
        currentY += rowHeight;
      });

      doc.end();
    });
  }
}
