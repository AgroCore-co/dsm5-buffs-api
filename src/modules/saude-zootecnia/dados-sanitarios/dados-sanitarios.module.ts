import { Module } from '@nestjs/common';
import { DadosSanitariosService } from './dados-sanitarios.service';
import { DadosSanitariosController } from './dados-sanitarios.controller';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { AlertasModule } from '../../alerta/alerta.module';

@Module({
  imports: [SupabaseModule, AlertasModule],
  controllers: [DadosSanitariosController],
  providers: [DadosSanitariosService],
  exports: [DadosSanitariosService],
})
export class DadosSanitariosModule {}
