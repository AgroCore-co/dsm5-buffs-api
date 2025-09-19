import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { SupabaseAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../auth/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Cargo } from './enums/cargo.enum';

@ApiTags('Usuários')
@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Criar perfil de proprietário',
    description: `Cria o perfil inicial do usuário no sistema após cadastro e login no Supabase.
    
    **IMPORTANTE:** 
    - Este endpoint é usado APENAS para criar o primeiro perfil do usuário
    - O cargo será automaticamente definido como PROPRIETARIO
    - O email e auth_id são extraídos automaticamente do token JWT
    - Para criar funcionários, use POST /usuarios/funcionarios`,
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Perfil de proprietário criado com sucesso. Cargo definido automaticamente como PROPRIETARIO.' 
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou endereço não encontrado.' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou expirado.' })
  @ApiResponse({ status: 409, description: 'Usuário já possui perfil cadastrado.' })
  create(@Body() createUsuarioDto: CreateUsuarioDto, @User() user: any) {
    return this.usuarioService.create(createUsuarioDto, user.email, user.id);
  }

  @Get()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Cargo.PROPRIETARIO, Cargo.GERENTE)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutos
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lista todos os usuários',
    description: 'Lista todos os usuários do sistema. Disponível apenas para proprietários e gerentes.',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuários retornada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Apenas proprietários e gerentes podem listar usuários.' })
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
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Cargo.PROPRIETARIO, Cargo.GERENTE)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutos
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Buscar usuário por ID',
    description: 'Busca um usuário específico por ID. Disponível apenas para proprietários e gerentes.',
  })
  @ApiResponse({ status: 200, description: 'Usuário encontrado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Cargo.PROPRIETARIO, Cargo.GERENTE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Atualizar usuário',
    description: 'Atualiza os dados de um usuário. Disponível apenas para proprietários e gerentes.',
  })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuarioService.update(id, updateUsuarioDto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Cargo.PROPRIETARIO)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Excluir usuário',
    description: 'Exclui um usuário do sistema. Disponível apenas para proprietários.',
  })
  @ApiResponse({ status: 200, description: 'Usuário excluído com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Apenas proprietários podem excluir usuários.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.remove(id);
  }

  // ===== ENDPOINTS PARA GESTÃO DE FUNCIONÁRIOS =====

  @Post('funcionarios')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Cargo.PROPRIETARIO, Cargo.GERENTE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Criar funcionário',
    description: `Permite que proprietários e gerentes criem novos funcionários no sistema.
    
    **Cargos disponíveis:**
    - GERENTE: Pode gerenciar usuários mas não propriedades
    - FUNCIONARIO: Acesso apenas às operações básicas
    - VETERINARIO: Acesso apenas às operações básicas
    
    **NOTA:** Este endpoint cria tanto a conta no Supabase quanto o perfil na aplicação.`,
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Funcionário criado com sucesso no Supabase e perfil criado na aplicação.' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Acesso negado. Apenas proprietários e gerentes podem criar funcionários.' 
  })
  @ApiResponse({ status: 409, description: 'Email já existe no sistema.' })
  createFuncionario(@Body() createFuncionarioDto: CreateFuncionarioDto, @User() user: any) {
    return this.usuarioService.createFuncionario(createFuncionarioDto, user.email);
  }

  @Get('funcionarios')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Cargo.PROPRIETARIO, Cargo.GERENTE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Listar funcionários',
    description: 'Lista todos os funcionários. Disponível para proprietários e gerentes.',
  })
  @ApiResponse({ status: 200, description: 'Lista de funcionários retornada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
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
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Cargo.PROPRIETARIO, Cargo.GERENTE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Desvincula um funcionário de uma propriedade',
    description: 'Remove o vínculo entre um funcionário e uma propriedade específica.',
  })
  @ApiResponse({ status: 200, description: 'Funcionário desvinculado com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  desvincularFuncionario(
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @Param('idPropriedade', ParseIntPipe) idPropriedade: number,
    @User() user: any
  ) {
    return this.usuarioService.desvincularFuncionario(idUsuario, idPropriedade, user.email);
  }
}
