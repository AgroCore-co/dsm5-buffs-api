import { Module } from '@nestjs/common';
import { VacinacaoController } from './vacinacao.controller';
import { VacinacaoService } from './vacinacao.service';
import { SupabaseModule } from 'src/core/supabase/supabase.module';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [VacinacaoController],
  providers: [VacinacaoService],
})
export class VacinacaoModule {}
