import { Module } from '@nestjs/common';
import { MaterialGeneticoService } from './material-genetico.service';
import { MaterialGeneticoController } from './material-genetico.controller';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [MaterialGeneticoController],
  providers: [MaterialGeneticoService],
  exports: [MaterialGeneticoService],
})
export class MaterialGeneticoModule {}
