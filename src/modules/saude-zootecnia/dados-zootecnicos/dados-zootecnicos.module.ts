import { Module } from '@nestjs/common';
import { DadosZootecnicosController } from './dados-zootecnicos.controller';
import { DadosZootecnicosService } from './dados-zootecnicos.service';
import { SupabaseModule } from 'src/core/supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';

@Module({
  imports: [SupabaseModule, AuthModule, LoggerModule],
  controllers: [DadosZootecnicosController],
  providers: [DadosZootecnicosService],
})
export class DadosZootecnicosModule {}
