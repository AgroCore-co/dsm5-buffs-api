import { Module } from '@nestjs/common';
import { EstoqueLeiteService } from './estoque-leite.service';
import { EstoqueLeiteController } from './estoque-leite.controller';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [SupabaseModule, LoggerModule, AuthModule],
  controllers: [EstoqueLeiteController],
  providers: [EstoqueLeiteService],
  exports: [EstoqueLeiteService],
})
export class EstoqueLeiteModule {}
