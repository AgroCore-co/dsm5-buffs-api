import { Module } from '@nestjs/common';
import { AlimentacaoDefController } from './alimentacao-def.controller';
import { AlimentacaoDefService } from './alimentacao-def.service';
import { SupabaseModule } from '../../../core/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [AlimentacaoDefController],
  providers: [AlimentacaoDefService],
  exports: [AlimentacaoDefService],
})
export class AlimentacaoDefModule {}
