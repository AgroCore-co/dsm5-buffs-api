import { Module } from '@nestjs/common';
import { GenealogiaController } from './genealogia.controller';
import { GenealogiaService } from './genealogia.service';
import { SupabaseModule } from '../../../core/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [GenealogiaController],
  providers: [GenealogiaService],
  exports: [GenealogiaService],
})
export class GenealogiaModule {}
