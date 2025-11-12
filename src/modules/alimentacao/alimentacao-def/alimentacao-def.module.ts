import { Module } from '@nestjs/common';
import { AlimentacaoDefController } from './alimentacao-def.controller';
import { AlimentacaoDefService } from './alimentacao-def.service';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';

@Module({
  imports: [SupabaseModule, AuthModule, LoggerModule],
  controllers: [AlimentacaoDefController],
  providers: [AlimentacaoDefService],
  exports: [AlimentacaoDefService],
})
export class AlimentacaoDefModule {}
