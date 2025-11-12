import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // 10 segundos de timeout
      maxRedirects: 5,
    }),
    LoggerModule,
  ],
  providers: [GeminiService],
  exports: [GeminiService], // Exportar para que outros módulos o possam usar
})
export class GeminiModule {}
