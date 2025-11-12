import { Module } from '@nestjs/common';
import { GenealogiaController } from './genealogia.controller';
import { GenealogiaService } from './genealogia.service';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';

@Module({
  imports: [SupabaseModule, AuthModule, LoggerModule],
  controllers: [GenealogiaController],
  providers: [GenealogiaService],
  exports: [GenealogiaService],
})
export class GenealogiaModule {}
