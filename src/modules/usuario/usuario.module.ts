import { Module } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { SupabaseModule } from '../../core/supabase/supabase.module';
import { CoreModule } from 'src/core/core.module';

@Module({
  imports: [SupabaseModule, CoreModule],
  controllers: [UsuarioController],
  providers: [UsuarioService],
})
export class UsuarioModule {}
