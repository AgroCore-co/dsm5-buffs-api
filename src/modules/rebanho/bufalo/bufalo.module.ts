import { Module } from '@nestjs/common';
import { BufaloService } from './bufalo.service';
import { BufaloController } from './bufalo.controller';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [BufaloController],
  providers: [BufaloService],
  exports: [BufaloService],
})
export class BufaloModule {}
