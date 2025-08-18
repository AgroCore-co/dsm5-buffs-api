import { Module } from '@nestjs/common';
import { AlimentacaoDefModule } from './alimentacao-def/alimentacao-def.module';
import { SupabaseModule } from '../../core/supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { RegistrosModule } from './registros/registros.module';

@Module({
  imports: [SupabaseModule, AuthModule, AlimentacaoDefModule, RegistrosModule],
  exports: [AlimentacaoDefModule, RegistrosModule],
})
export class AlimentacaoModule {}
