import { Module } from '@nestjs/common';
import { AlertasService } from './alerta.service';
import { AlertasController } from './alerta.controller';
import { SupabaseModule } from 'src/core/supabase/supabase.module';

@Module({
  imports: [SupabaseModule], 
  controllers: [AlertasController],
  providers: [AlertasService],
  exports: [AlertasService],
})
export class AlertasModule {}
