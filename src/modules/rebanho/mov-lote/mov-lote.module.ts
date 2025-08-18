import { Module } from '@nestjs/common';
import { MovLoteService } from './mov-lote.service';
import { MovLoteController } from './mov-lote.controller';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [MovLoteController],
  providers: [MovLoteService],
  exports: [MovLoteService],
})
export class MovLoteModule {}


