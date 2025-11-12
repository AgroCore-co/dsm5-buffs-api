import { Module } from '@nestjs/common';
import { SimulacaoService } from './simulacao.service';
import { SimulacaoController } from './simulacao.controller';
import { BufaloModule } from '../../rebanho/bufalo/bufalo.module';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../../auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';

@Module({
  imports: [
    BufaloModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    AuthModule,
    LoggerModule,
  ],
  controllers: [SimulacaoController],
  providers: [SimulacaoService],
})
export class SimulacaoModule {}
