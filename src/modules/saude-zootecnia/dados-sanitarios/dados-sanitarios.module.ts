import { Module } from '@nestjs/common';
import { DadosSanitariosService } from './dados-sanitarios.service';
import { DadosSanitariosController } from './dados-sanitarios.controller';
import { SupabaseModule } from '../../../core/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [DadosSanitariosController],
  providers: [DadosSanitariosService],
  exports: [DadosSanitariosService],
})
export class DadosSanitariosModule {}
