import { Module } from '@nestjs/common';
import { CoberturaController } from './cobertura.controller';
import { CoberturaService } from './cobertura.service';
import { CoberturaValidator } from './validators/cobertura.validator';
import { SupabaseModule } from 'src/core/supabase/supabase.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { AlertasModule } from 'src/modules/alerta/alerta.module';
import { LoggerModule } from 'src/core/logger/logger.module';

@Module({
  imports: [SupabaseModule, AuthModule, AlertasModule, LoggerModule],
  controllers: [CoberturaController],
  providers: [CoberturaService, CoberturaValidator],
})
export class CoberturaModule {}
