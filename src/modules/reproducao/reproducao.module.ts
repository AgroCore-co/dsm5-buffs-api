import { Module } from '@nestjs/common';
import { CoberturaModule } from './cobertura/cobertura.module';

@Module({
  imports: [CoberturaModule]
})
export class ReproducaoModule {}
