import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotService } from './lot.service';
import { LotController } from './lot.controller';
import { Lot } from './entities/lot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lot])],
  controllers: [LotController],
  providers: [LotService],
  exports: [LotService, TypeOrmModule], // Exporta para usar em outros módulos
})
export class LotModule {}