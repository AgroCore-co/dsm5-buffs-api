import { Module } from '@nestjs/common';
import { GeminiModule } from './gemini/gemini.module';
import { LoggerModule } from './logger/logger.module';
import { SupabaseModule } from './supabase/supabase.module';
import { CacheConfigModule } from './cache/cache.module';
import { CacheService } from './cache/cache.service';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    GeminiModule,
    LoggerModule,
    SupabaseModule,
    CacheConfigModule,
    PrismaModule
  ],
  providers: [CacheService, PrismaService],
  exports: [
    GeminiModule,
    LoggerModule,
    SupabaseModule,
    PrismaService,
    CacheConfigModule,
    CacheService,
  ],
})
export class CoreModule {}