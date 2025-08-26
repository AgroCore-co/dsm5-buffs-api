import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';
import { CicloLactacaoController } from './ciclo-lactacao.controller';
import { CicloLactacaoService } from './ciclo-lactacao.service';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [CicloLactacaoController],
  providers: [CicloLactacaoService],
  exports: [CicloLactacaoService],
})
export class CicloLactacaoModule {}


