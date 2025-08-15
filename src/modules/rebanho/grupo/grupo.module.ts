import { Module } from '@nestjs/common';
import { GrupoController } from './grupo.controller';
import { GrupoService } from './grupo.service';
import { SupabaseModule } from '../../../core/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [GrupoController],
  providers: [GrupoService],
  exports: [GrupoService],
})
export class GrupoModule {}
