import { Module } from '@nestjs/common';
import { AlertasService } from './alerta.service';
import { AlertasController } from './alerta.controller';
import { AlertasScheduler } from './alerta.scheduler';
import { SupabaseModule } from 'src/core/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [AlertasController],
  providers: [AlertasService, AlertasScheduler],
  exports: [AlertasService],
})
export class AlertasModule {}
