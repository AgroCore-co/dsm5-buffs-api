import { Module } from '@nestjs/common';
import { CoberturaController } from './cobertura.controller';
import { CoberturaService } from './cobertura.service';
import { SupabaseModule } from 'src/core/supabase/supabase.module';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [CoberturaController],
  providers: [CoberturaService],
})
export class CoberturaModule {}
