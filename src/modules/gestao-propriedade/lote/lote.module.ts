import { Module } from '@nestjs/common';
import { LoteController } from './lote.controller';
import { LoteService } from './lote.service';
import { SupabaseModule } from '../../../core/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [LoteController],
  providers: [LoteService],
  exports: [LoteService],
})
export class LoteModule {}
