import { Module } from '@nestjs/common';
import { LoteController } from './lote.controller';
import { LoteService } from './lote.service';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';

@Module({
  imports: [SupabaseModule, AuthModule, LoggerModule],
  controllers: [LoteController],
  providers: [LoteService],
  exports: [LoteService],
})
export class LoteModule {}
