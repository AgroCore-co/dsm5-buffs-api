import { Module } from '@nestjs/common';
import { ControleLeiteiroController } from './controle-leiteiro.controller';
import { ControleLeiteiroService } from './controle-leiteiro.service';

@Module({
  controllers: [ControleLeiteiroController],
  providers: [ControleLeiteiroService]
})
export class ControleLeiteiroModule {}
