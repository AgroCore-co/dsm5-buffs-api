import { Module } from '@nestjs/common';
import { DadosZootecnicosModule } from './dados-zootecnicos/dados-zootecnicos.module';

@Module({
  imports: [DadosZootecnicosModule]
})
export class SaudeZootecniaModule {}
