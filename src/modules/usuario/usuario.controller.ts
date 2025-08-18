import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { User } from '../auth/user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Usuários')
@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cria o perfil de dados de um novo usuário',
    description: `Cria o perfil de dados (nome, cargo, etc.) para um usuário **previamente autenticado**. 
    Este endpoint deve ser chamado **após** o usuário ter se cadastrado via Supabase Auth e ter feito login pela primeira vez.
    O \`email\` do usuário é extraído automaticamente do token JWT. **Não inclua o campo \`email\` no corpo da requisição**.`,
  })
  @ApiResponse({ status: 201, description: 'O perfil foi criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Requisição inválida (ex: id_endereco não existe).' })
  @ApiResponse({ status: 401, description: 'Não autorizado. Token JWT inválido ou ausente.' })
  @ApiResponse({ status: 409, description: 'Este usuário já possui um perfil cadastrado.' })
  create(@Body() createUsuarioDto: CreateUsuarioDto, @User() user: any) {
    return this.usuarioService.create(createUsuarioDto, user.email);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista todos os perfis de usuário',
    description: 'Retorna uma lista de todos os perfis de usuário cadastrados no banco de dados. Este é um endpoint público.',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuários retornada com sucesso.' })
  findAll() {
    return this.usuarioService.findAll();
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Retorna o perfil do usuário logado',
    description: 'Busca e retorna o perfil de dados completo do usuário que está fazendo a requisição, com base no token JWT fornecido.',
  })
  @ApiResponse({ status: 200, description: 'Perfil do usuário retornado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado para o usuário autenticado.' })
  findMyProfile(@User() user: any) {
    return this.usuarioService.findOneById(user.email);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca um perfil de usuário pelo ID numérico',
    description: 'Retorna um perfil de usuário específico com base no seu ID primário (numérico) no banco de dados. Este é um endpoint público.',
  })
  @ApiResponse({ status: 200, description: 'Perfil do usuário retornado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Usuário com o ID fornecido não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Atualiza um perfil de usuário',
    description:
      'Atualiza os dados de um perfil de usuário existente. Requer autenticação. (Nota: A lógica de permissão, como permitir que apenas o próprio usuário ou um admin atualize, deve ser implementada no futuro).',
  })
  @ApiResponse({ status: 200, description: 'Perfil atualizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado para atualização.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuarioService.update(id, updateUsuarioDto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Deleta um perfil de usuário',
    description:
      'Remove um perfil de usuário do banco de dados. Esta ação não pode ser desfeita. Requer autenticação. (Nota: A lógica de permissão deve ser implementada no futuro).',
  })
  @ApiResponse({ status: 200, description: 'Usuário deletado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.remove(id);
  }
}
