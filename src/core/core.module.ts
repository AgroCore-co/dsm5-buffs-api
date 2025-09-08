import { Module } from '@nestjs/common';
import { GeminiModule } from './gemini/gemini.module';
import { LoggerModule } from './logger/logger.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    GeminiModule,
    LoggerModule,
    SupabaseModule,
  ],
  exports: [
    GeminiModule,
    LoggerModule,
    SupabaseModule,
  ],
})
export class CoreModule {}