import { Module } from '@nestjs/common';
import { RacaController } from './raca.controller';
import { RacaService } from './raca.service';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [SupabaseModule, LoggerModule, AuthModule],
  controllers: [RacaController],
  providers: [RacaService],
  exports: [RacaService],
})
export class RacaModule {}
