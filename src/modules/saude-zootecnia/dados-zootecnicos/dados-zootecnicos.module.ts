import { Module } from '@nestjs/common';
import { DadosZootecnicosController } from './dados-zootecnicos.controller';
import { DadosZootecnicosService } from './dados-zootecnicos.service';
import { SupabaseModule } from 'src/core/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [DadosZootecnicosController],
  providers: [DadosZootecnicosService]
})
export class DadosZootecnicosModule {}
