import { Module } from '@nestjs/common';
import { CoberturaModule } from './cobertura/cobertura.module';
import { MaterialGeneticoModule } from './material-genetico/material-genetico.module';

@Module({
  imports: [CoberturaModule, MaterialGeneticoModule]
})
export class ReproducaoModule {}
