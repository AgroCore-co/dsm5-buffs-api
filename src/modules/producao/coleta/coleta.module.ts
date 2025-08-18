import { Module } from '@nestjs/common';
import { ColetaService } from './coleta.service';
import { ColetaController } from './coleta.controller';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [ColetaController],
  providers: [ColetaService],
  exports: [ColetaService],
})
export class ColetaModule {}


