import { Module } from '@nestjs/common';
import { LoteController } from './lote.controller';
import { LoteService } from './lote.service';
import { SupabaseModule } from 'src/core/supabase/supabase.module';
// Futuramente, você importará outros services e controllers aqui (ex: PropriedadeService)

@Module({
  imports: [SupabaseModule],
  controllers: [LoteController],
  providers: [LoteService],
})     
export class GestaoPropriedadeModule {}
