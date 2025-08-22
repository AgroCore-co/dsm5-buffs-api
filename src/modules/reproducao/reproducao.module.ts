import { Module } from '@nestjs/common';
import { CoberturaModule } from './cobertura/cobertura.module';
import { MaterialGeneticoModule } from './material-genetico/material-genetico.module';
import { GenealogiaModule } from './genealogia/genealogia.module';
import { SimulacaoModule } from './simulacao/simulacao.module';

@Module({
  imports: [CoberturaModule, MaterialGeneticoModule, GenealogiaModule, SimulacaoModule],
})
export class ReproducaoModule {}
