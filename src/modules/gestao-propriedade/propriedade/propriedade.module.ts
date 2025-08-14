import { Module } from '@nestjs/common';
import { PropriedadeController } from './propriedade.controller';
import { PropriedadeService } from './propriedade.service';
import { SupabaseModule } from '../../../core/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [PropriedadeController],
  providers: [PropriedadeService],
  exports: [PropriedadeService],
})
export class PropriedadeModule {}
