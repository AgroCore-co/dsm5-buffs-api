import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './core/supabase/supabase.module';

@Module({
  imports: [
    // 1. ConfigModule para ler o arquivo .env globalmente
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Nosso módulo core para conectar à API do Supabase
    SupabaseModule,

    // 3. Seus outros módulos de funcionalidades virão aqui
    // AuthModule,
    // ...
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}