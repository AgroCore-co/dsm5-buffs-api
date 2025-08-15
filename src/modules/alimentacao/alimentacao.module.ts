import { Module } from '@nestjs/common';
import { AlimentacaoDefModule } from './alimentacao-def/alimentacao-def.module';
import { SupabaseModule } from '../../core/supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    SupabaseModule,
    AuthModule,
    AlimentacaoDefModule,
  ],
  exports: [AlimentacaoDefModule],
})
export class AlimentacaoModule {}
