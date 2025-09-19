import { Module } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { SupabaseModule } from '../../core/supabase/supabase.module';
import { CoreModule } from 'src/core/core.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [SupabaseModule, CoreModule],
  controllers: [UsuarioController],
  providers: [UsuarioService, RolesGuard],
  exports: [UsuarioService]
})
export class UsuarioModule {}
