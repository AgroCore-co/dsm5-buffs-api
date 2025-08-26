import { Module } from '@nestjs/common';
import { ControleLeiteiroModule } from './controle-leiteiro/controle-leiteiro.module';
import { EstoqueLeiteModule } from './estoque-leite/estoque-leite.module';
import { ColetaModule } from './coleta/coleta.module';
import { CicloLactacaoModule } from './ciclo-lactacao/ciclo-lactacao.module';

@Module({
  imports: [ControleLeiteiroModule, EstoqueLeiteModule, ColetaModule, CicloLactacaoModule],
})
export class ProducaoModule {}
