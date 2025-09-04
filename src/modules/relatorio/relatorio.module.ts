import { Module } from '@nestjs/common';
import { RelatorioService } from './relatorio.service';
import { RelatorioController } from './relatorio.controller';
import { SupabaseModule } from 'src/core/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [RelatorioService],
  controllers: [RelatorioController]
})
export class RelatorioModule {}
