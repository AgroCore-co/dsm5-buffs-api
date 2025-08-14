import { Module } from '@nestjs/common';
import { EnderecoController } from './endereco.controller';
import { EnderecoService } from './endereco.service';
import { SupabaseModule } from '../../../core/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [EnderecoController],
  providers: [EnderecoService],
})
export class EnderecoModule {}
