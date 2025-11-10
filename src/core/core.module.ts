import { Module } from '@nestjs/common';
import { GeminiModule } from './gemini/gemini.module';
import { LoggerModule } from './logger/logger.module';
import { SupabaseModule } from './supabase/supabase.module';
import { CacheConfigModule } from './cache/cache.module';
import { CacheService } from './cache/cache.service';

@Module({
  imports: [GeminiModule, LoggerModule, SupabaseModule, CacheConfigModule],
  providers: [CacheService],
  exports: [GeminiModule, LoggerModule, SupabaseModule, CacheConfigModule, CacheService],
})
export class CoreModule {}
