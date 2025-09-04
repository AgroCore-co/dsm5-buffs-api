import { Controller, Post, Body, Res, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { RelatorioService } from './relatorio.service';
import { CreateRelatorioDto } from './dto/create-relatorio.dto';
import { Response } from 'express';
import { SupabaseAuthGuard } from '../auth/auth.guard';

@UseGuards(SupabaseAuthGuard)
@Controller('relatorios')
export class RelatorioController {
  constructor(private readonly relatorioService: RelatorioService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async gerarRelatorio(
    @Body() createRelatorioDto: CreateRelatorioDto,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.relatorioService.gerarRelatorioPdf(
      createRelatorioDto,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=relatorio.pdf',
    );
    res.send(pdfBuffer);
  }
}
