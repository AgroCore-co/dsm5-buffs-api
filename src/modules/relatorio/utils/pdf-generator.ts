import * as PDFDocument from 'pdfkit';

// Reutilizamos a interface para manter a consistência
interface ColunaDef {
  header: string;
  key: string;
}

/**
 * Gera um buffer de PDF a partir de um conjunto de dados e colunas.
 * Toda a lógica de estilização e layout está contida aqui.
 * @param titulo O título principal do relatório.
 * @param colunas As definições de cabeçalho e chave para cada coluna.
 * @param dados O array de objetos a serem exibidos na tabela.
 * @returns Uma Promise que resolve com o Buffer do PDF.
 */
export function gerarTabelaPdf(
  titulo: string,
  colunas: ColunaDef[],
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
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    let pageNumber = 1;

    const drawHeader = () => {
      doc.fontSize(18).font('Helvetica-Bold').text(titulo, { align: 'center' });
      doc.moveDown();
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(`Data de Emissão: ${new Date().toLocaleString('pt-BR')}`, {
          align: 'right',
        });
      doc.moveDown(2);
    };

    const drawFooter = () => {
      const footerY = doc.page.height - 40;
      doc
        .fontSize(8)
        .font('Helvetica-Oblique')
        .text(`Página ${pageNumber}`, doc.page.margins.left, footerY, {
          align: 'right',
        });
    };

    doc.on('pageAdded', () => {
      pageNumber++;
      drawHeader();
      drawFooter();
    });

    drawHeader();
    drawFooter();

    const tableTop = 120;
    const rowHeight = 20;
    const tableWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = tableWidth / colunas.length;

    const drawTableRow = (y: number, rowData: string[], isHeader = false) => {
      let currentX = doc.page.margins.left;
      doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);

      if (isHeader) {
        doc
          .rect(currentX, y, tableWidth, rowHeight)
          .fillAndStroke('#333', '#333');
        doc.fillColor('#FFF');
      } else {
        doc.fillColor('#000');
      }

      rowData.forEach((cellText) => {
        doc.text(cellText, currentX + 5, y + 6, {
          width: colWidth - 10,
          align: 'left',
        });
        currentX += colWidth;
      });

      doc.fillColor('#000');
    };

    let currentY = tableTop;
    const drawTableHeader = (y) => {
      drawTableRow(
        y,
        colunas.map((c) => c.header),
        true,
      );
    };

    drawTableHeader(currentY);
    currentY += rowHeight;

    dados.forEach((item, index) => {
      if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top + 20;
        drawTableHeader(currentY);
        currentY += rowHeight;
      }

      if (index % 2 !== 0) {
        doc
          .rect(doc.page.margins.left, currentY, tableWidth, rowHeight)
          .fillAndStroke('#EEE', '#FFF');
      }

      const rowData = colunas.map((col) => String(item[col.key]));
      drawTableRow(currentY, rowData);
      currentY += rowHeight;
    });

    doc.end();
  });
}
