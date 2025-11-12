import { Module } from '@nestjs/common';
import { PropriedadeController } from './propriedade.controller';
import { PropriedadeService } from './propriedade.service';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';

@Module({
  imports: [SupabaseModule, AuthModule, LoggerModule],
  controllers: [PropriedadeController],
  providers: [PropriedadeService],
  exports: [PropriedadeService],
})
export class PropriedadeModule {}
