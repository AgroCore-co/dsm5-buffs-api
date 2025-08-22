import { Module } from '@nestjs/common';
import { SimulacaoService } from './simulacao.service';
import { SimulacaoController } from './simulacao.controller';
import { BufaloModule } from '../../rebanho/bufalo/bufalo.module';
import { HttpModule } from '@nestjs/axios'; // Importe o HttpModule

@Module({
  imports: [
    BufaloModule, // Para ter acesso ao BufaloService
    // HttpModule é necessário para fazer chamadas HTTP para a futura API Python
    HttpModule.register({
      timeout: 5000, // Timeout de 5 segundos
      maxRedirects: 5,
    }),
  ],
  controllers: [SimulacaoController],
  providers: [SimulacaoService],
})
export class SimulacaoModule {}