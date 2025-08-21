import { Module } from '@nestjs/common';
import { CoberturaModule } from './cobertura/cobertura.module';
import { MaterialGeneticoModule } from './material-genetico/material-genetico.module';
import { GenealogiaModule } from './genealogia/genealogia.module';

@Module({
  imports: [CoberturaModule, MaterialGeneticoModule, GenealogiaModule],
})
export class ReproducaoModule {}
