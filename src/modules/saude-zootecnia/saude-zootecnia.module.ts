import { Module } from '@nestjs/common';
import { DadosZootecnicosModule } from './dados-zootecnicos/dados-zootecnicos.module';
import { MedicamentosModule } from './medicamentos/medicamentos.module';
import { VacinacaoModule } from './vacinacao/vacinacao.module';

@Module({
  imports: [DadosZootecnicosModule, MedicamentosModule, VacinacaoModule],
})
export class SaudeZootecniaModule {}
