import { Module } from '@nestjs/common';
import { UsuarioService } from './services/usuario.service';
import { FuncionarioService } from './services/funcionario.service';
import { UsuarioController } from './controller/usuario.controller';
import { FuncionarioController } from './controller/funcionario.controller';
import { CoreModule } from 'src/core/core.module';

@Module({
  imports: [CoreModule],
  controllers: [UsuarioController, FuncionarioController],
  providers: [UsuarioService, FuncionarioService],
  exports: [UsuarioService, FuncionarioService],
})
export class UsuarioModule {}
