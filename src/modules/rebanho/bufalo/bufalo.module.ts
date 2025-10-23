import { Module } from '@nestjs/common';
import { BufaloService } from './bufalo.service';
import { BufaloController } from './bufalo.controller';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';
import { GenealogiaModule } from '../../reproducao/genealogia/genealogia.module';

@Module({
  imports: [SupabaseModule, AuthModule, GenealogiaModule],
  controllers: [BufaloController],
  providers: [BufaloService],
  exports: [BufaloService],
})
export class BufaloModule {}
