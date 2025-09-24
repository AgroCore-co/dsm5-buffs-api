import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { UsuarioService } from '../services/usuario.service';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Cargo } from '../enums/cargo.enum';

@ApiTags('Usuários (Perfis)')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar perfil de proprietário',
    description: `Cria o perfil inicial do usuário no sistema após cadastro e login. O cargo será automaticamente definido como PROPRIETARIO.`,
  })
  @ApiResponse({ status: 201, description: 'Perfil de proprietário criado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou expirado.' })
  @ApiResponse({ status: 409, description: 'Usuário já possui perfil cadastrado.' })
  create(@Body() createUsuarioDto: CreateUsuarioDto, @User() user: any) {
    console.log('--- DADOS DO USUÁRIO DO TOKEN JWT ---', user);
    return this.usuarioService.create(createUsuarioDto, user.email, user.sub);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Retorna o perfil do usuário logado',
    description: 'Busca e retorna o perfil de dados do usuário que está fazendo a requisição.',
  })
  @ApiResponse({ status: 200, description: 'Perfil do usuário retornado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado para o usuário autenticado.' })
  findMyProfile(@User() user: any) {
    return this.usuarioService.findOneByEmail(user.email);
  }

  @Get()
  @Roles(Cargo.PROPRIETARIO, Cargo.GERENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Lista todos os usuários (Admin)',
    description: 'Lista todos os usuários do sistema. Apenas para proprietários e gerentes.',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuários retornada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  findAll() {
    return this.usuarioService.findAll();
  }

  @Get(':id')
  @Roles(Cargo.PROPRIETARIO, Cargo.GERENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Buscar usuário por ID (Admin)',
    description: 'Busca um usuário específico por seu ID numérico. Apenas para proprietários e gerentes.',
  })
  @ApiResponse({ status: 200, description: 'Usuário encontrado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.findOne(id);
  }

  @Patch(':id')
  @Roles(Cargo.PROPRIETARIO, Cargo.GERENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Atualizar usuário (Admin)',
    description: 'Atualiza os dados de um usuário. Apenas para proprietários e gerentes.',
  })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuarioService.update(id, updateUsuarioDto);
  }

  @Delete(':id')
  @Roles(Cargo.PROPRIETARIO)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Excluir usuário (Proprietário)',
    description: 'Exclui um usuário do sistema. Apenas para proprietários.',
  })
  @ApiResponse({ status: 200, description: 'Usuário excluído com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.remove(id);
  }
}
