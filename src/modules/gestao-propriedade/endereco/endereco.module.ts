import { Module } from '@nestjs/common';
import { EnderecoController } from './endereco.controller';
import { EnderecoService } from './endereco.service';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';

@Module({
  imports: [SupabaseModule, AuthModule, LoggerModule],
  controllers: [EnderecoController],
  providers: [EnderecoService],
})
export class EnderecoModule {}
