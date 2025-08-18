import { Module } from '@nestjs/common';
import { CoberturaController } from './cobertura.controller';
import { CoberturaService } from './cobertura.service';
import { SupabaseModule } from 'src/core/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [CoberturaController],
  providers: [CoberturaService],
})
export class CoberturaModule {}
