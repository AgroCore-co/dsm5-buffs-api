import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { SupabaseModule } from '../../core/supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { LoggerModule } from '../../core/logger/logger.module';

@Module({
  imports: [SupabaseModule, AuthModule, LoggerModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
