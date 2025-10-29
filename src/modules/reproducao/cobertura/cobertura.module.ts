import { Module } from '@nestjs/common';
import { CoberturaController } from './cobertura.controller';
import { CoberturaService } from './cobertura.service';
import { SupabaseModule } from 'src/core/supabase/supabase.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { AlertasModule } from 'src/modules/alerta/alerta.module';

@Module({
  imports: [SupabaseModule, AuthModule, AlertasModule],
  controllers: [CoberturaController],
  providers: [CoberturaService],
})
export class CoberturaModule {}
