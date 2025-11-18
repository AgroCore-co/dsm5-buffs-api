import { Module } from '@nestjs/common';
import { CoberturaController } from './cobertura.controller';
import { CoberturaService } from './cobertura.service';
import { CoberturaValidator } from './validators/cobertura.validator';
import { CoberturaRepository } from './repositories/cobertura.repository';
import { SupabaseModule } from 'src/core/supabase/supabase.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { AlertasModule } from 'src/modules/alerta/alerta.module';
import { LoggerModule } from 'src/core/logger/logger.module';

/**
 * Módulo de coberturas com Clean Architecture.
 *
 * **Providers registrados:**
 * - CoberturaService (orquestrador)
 * - CoberturaRepository (acesso a dados)
 * - CoberturaValidator (validações de negócio)
 */
@Module({
  imports: [SupabaseModule, AuthModule, AlertasModule, LoggerModule],
  controllers: [CoberturaController],
  providers: [CoberturaService, CoberturaRepository, CoberturaValidator],
})
export class CoberturaModule {}
