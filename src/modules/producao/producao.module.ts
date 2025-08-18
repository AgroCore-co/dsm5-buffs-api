import { Module } from '@nestjs/common';
import { ControleLeiteiroModule } from './controle-leiteiro/controle-leiteiro.module';
import { EstoqueLeiteModule } from './estoque-leite/estoque-leite.module';
import { ColetaModule } from './coleta/coleta.module';

@Module({
  imports: [ControleLeiteiroModule, EstoqueLeiteModule, ColetaModule],
})
export class ProducaoModule {}
