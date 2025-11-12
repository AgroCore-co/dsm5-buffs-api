import { Module } from '@nestjs/common';
import { IndustriaService } from './industria.service';
import { IndustriaController } from './industria.controller';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [SupabaseModule, LoggerModule, AuthModule],
  controllers: [IndustriaController],
  providers: [IndustriaService],
  exports: [IndustriaService],
})
export class IndustriaModule {}
