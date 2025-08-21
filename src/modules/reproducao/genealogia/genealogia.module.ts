import { Module } from '@nestjs/common';
import { GenealogiaController } from './genealogia.controller';
import { GenealogiaService } from './genealogia.service';
import { BufaloModule } from '../../rebanho/bufalo/bufalo.module';

@Module({
  imports: [BufaloModule],
  controllers: [GenealogiaController],
  providers: [GenealogiaService],
})
export class GenealogiaModule {}