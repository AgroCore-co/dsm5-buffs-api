import { Module } from '@nestjs/common';
import { CoberturaController } from './cobertura.controller';
import { CoberturaService } from './cobertura.service';

@Module({
  controllers: [CoberturaController],
  providers: [CoberturaService]
})
export class CoberturaModule {}
