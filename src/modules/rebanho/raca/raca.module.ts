import { Module } from '@nestjs/common';
import { RacaController } from './raca.controller';
import { RacaService } from './raca.service';
import { SupabaseModule } from '../../../core/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [RacaController],
  providers: [RacaService],
  exports: [RacaService],
})
export class RacaModule {}
