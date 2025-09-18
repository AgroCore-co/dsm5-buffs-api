import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { User } from '../auth/user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Usuários')
@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post('perfil')
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
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutos
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
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60000) // 1 minuto - dados próprios podem mudar
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
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutos
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

  // ===== ENDPOINTS PARA GESTÃO DE FUNCIONÁRIOS =====

  @Post('funcionarios')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cria um novo funcionário',
    description: `Permite que um proprietário crie um funcionário para sua(s) propriedade(s). 
    O funcionário será automaticamente vinculado às propriedades do proprietário.
    Se id_propriedade for especificado, o funcionário será vinculado apenas àquela propriedade específica.`,
  })
  @ApiResponse({ status: 201, description: 'Funcionário criado e vinculado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Você não é proprietário da propriedade especificada.' })
  @ApiResponse({ status: 409, description: 'Email já existe.' })
  createFuncionario(@Body() createFuncionarioDto: CreateFuncionarioDto, @User() user: any) {
    return this.usuarioService.createFuncionario(createFuncionarioDto, user.email);
  }

  @Get('funcionarios')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lista todos os funcionários do proprietário',
    description: 'Retorna todos os funcionários vinculados às propriedades do usuário logado.',
  })
  @ApiResponse({ status: 200, description: 'Lista de funcionários retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Usuário não possui propriedades.' })
  listarMeusFuncionarios(@User() user: any) {
    return this.usuarioService.listarMeusFuncionarios(user.email);
  }

  @Get('funcionarios/propriedade/:id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lista funcionários de uma propriedade específica',
    description: 'Retorna todos os funcionários vinculados a uma propriedade específica.',
  })
  @ApiResponse({ status: 200, description: 'Lista de funcionários da propriedade retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Você não é proprietário desta propriedade.' })
  listarFuncionariosPorPropriedade(@Param('id', ParseIntPipe) idPropriedade: number, @User() user: any) {
    return this.usuarioService.listarFuncionariosPorPropriedade(idPropriedade, user.email);
  }

  @Delete('funcionarios/:idUsuario/propriedade/:idPropriedade')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Desvincula um funcionário de uma propriedade',
    description: 'Remove o vínculo entre um funcionário e uma propriedade específica.',
  })
  @ApiResponse({ status: 200, description: 'Funcionário desvinculado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Você não é proprietário desta propriedade.' })
  desvincularFuncionario(
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @Param('idPropriedade', ParseIntPipe) idPropriedade: number,
    @User() user: any
  ) {
    return this.usuarioService.desvincularFuncionario(idUsuario, idPropriedade, user.email);
  }
}
