import { Module } from '@nestjs/common';
import { BufaloService } from './bufalo.service';
import { BufaloController } from './bufalo.controller';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import { AuthModule } from '../../auth/auth.module';
import { GenealogiaModule } from '../../reproducao/genealogia/genealogia.module';

// Novos providers da arquitetura limpa
import { BufaloRepository } from './repositories/bufalo.repository';
import { BufaloMaturidadeService } from './services/bufalo-maturidade.service';
import { BufaloCategoriaService } from './services/bufalo-categoria.service';
import { BufaloFiltrosService } from './services/bufalo-filtros.service';

/**
 * Módulo de búfalos com Clean Architecture.
 *
 * **Providers registrados:**
 * - BufaloService (orquestrador)
 * - BufaloRepository (acesso a dados)
 * - BufaloMaturidadeService (lógica de maturidade)
 * - BufaloCategoriaService (lógica de categoria ABCB)
 * - BufaloFiltrosService (lógica de filtros unificados)
 */
@Module({
  imports: [SupabaseModule, LoggerModule, AuthModule, GenealogiaModule],
  controllers: [BufaloController],
  providers: [BufaloService, BufaloRepository, BufaloMaturidadeService, BufaloCategoriaService, BufaloFiltrosService],
  exports: [BufaloService],
})
export class BufaloModule {}
