// src/modules/usuario/usuario.controller.ts

import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { User } from '../auth/user.decorator';
// O payload do token não é um AuthUser completo, então podemos usar 'any' ou criar uma interface.
// Para simplificar, vamos usar 'any' por enquanto.
// import { AuthUser } from '@supabase/supabase-js'; 

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  findMyProfile(@User() user: any) { // Mudamos para 'any' para refletir o payload genérico
    // O ID do usuário no JWT do Supabase está no campo 'sub'
    // CORREÇÃO AQUI:
    return this.usuarioService.findOneById(user.sub);
  }

  @Get()
  findAll() {
    return this.usuarioService.findAll();
  }
}