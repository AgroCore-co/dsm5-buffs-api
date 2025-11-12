import { Module } from '@nestjs/common';
import { VacinacaoController } from './vacinacao.controller';
import { VacinacaoService } from './vacinacao.service';
import { SupabaseModule } from 'src/core/supabase/supabase.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';

@Module({
  imports: [SupabaseModule, AuthModule, LoggerModule],
  controllers: [VacinacaoController],
  providers: [VacinacaoService],
})
export class VacinacaoModule {}
