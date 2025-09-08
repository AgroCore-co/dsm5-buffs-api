    import { Module } from '@nestjs/common';
    import { LoggerModule } from './logger/logger.module';
    import { SupabaseModule } from './supabase/supabase.module';
    import { GeminiModule } from './gemini/gemini.module'; 

    @Module({
      imports: [
        LoggerModule, 
        SupabaseModule, 
        GeminiModule
      ],
      exports: [
        LoggerModule, 
        SupabaseModule, 
        GeminiModule
      ],
    })
    export class CoreModule {}
    
