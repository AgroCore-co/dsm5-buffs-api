import { Module } from '@nestjs/common';
import { RelatorioService } from './relatorio.service';
import { RelatorioController } from './relatorio.controller';

@Module({
  providers: [RelatorioService],
  controllers: [RelatorioController]
})
export class RelatorioModule {}
