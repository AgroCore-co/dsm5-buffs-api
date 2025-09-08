import { Module } from '@nestjs/common';
import { ControleLeiteiroService } from './controle-leiteiro.service';
import { ControleLeiteiroController } from './controle-leiteiro.controller';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';
import { AlertasModule } from '../../alerta/alerta.module';
import { GeminiModule } from '../../../core/gemini/gemini.module';

@Module({
  imports: [SupabaseModule, AuthModule, AlertasModule, GeminiModule],
  controllers: [ControleLeiteiroController],
  providers: [ControleLeiteiroService],
  exports: [ControleLeiteiroService],
})
export class ControleLeiteiroModule {}
