import { Module } from '@nestjs/common';
import { AlertasService } from './alerta.service';
import { AlertasController } from './alerta.controller';
import { AlertasScheduler } from './alerta.scheduler';
import { SupabaseModule } from 'src/core/supabase/supabase.module';

import { BufaloRepository } from './repositories/bufalo.repository';
import { ReproducaoRepository } from './repositories/reproducao.repository';
import { SanitarioRepository } from './repositories/sanitario.repository';
import { ProducaoRepository } from './repositories/producao.repository';

import { AlertaReproducaoService } from './services/alerta-reproducao.service';
import { AlertaSanitarioService } from './services/alerta-sanitario.service';
import { AlertaProducaoService } from './services/alerta-producao.service';
import { AlertaManejoService } from './services/alerta-manejo.service';
import { AlertaClinicoService } from './services/alerta-clinico.service';

@Module({
  imports: [SupabaseModule],
  controllers: [AlertasController],
  providers: [
    // Core service
    AlertasService,

    // Scheduler
    AlertasScheduler,

    // Repositories
    BufaloRepository,
    ReproducaoRepository,
    SanitarioRepository,
    ProducaoRepository,

    // Domain services
    AlertaReproducaoService,
    AlertaSanitarioService,
    AlertaProducaoService,
    AlertaManejoService,
    AlertaClinicoService,
  ],
  exports: [AlertasService],
})
export class AlertasModule {}
