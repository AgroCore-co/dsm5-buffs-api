import { Controller, Get, Post, Body, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { FuncionarioService } from '../services/funcionario.service';
import { CreateFuncionarioDto } from '../dto/create-funcionario.dto';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Cargo } from '../enums/cargo.enum';

@ApiTags('Funcionários')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('funcionarios')
export class FuncionarioController {
  constructor(private readonly funcionarioService: FuncionarioService) {}

  @Post()
  @Roles(Cargo.PROPRIETARIO, Cargo.GERENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Criar funcionário',
    description: `Permite que proprietários e gerentes criem novos funcionários no sistema.`,
  })
  @ApiResponse({ status: 201, description: 'Funcionário criado com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 409, description: 'Email já existe no sistema.' })
  createFuncionario(@Body() createFuncionarioDto: CreateFuncionarioDto, @User() user: any) {
    return this.funcionarioService.createFuncionario(createFuncionarioDto, user.email);
  }

  @Get()
  @Roles(Cargo.PROPRIETARIO, Cargo.GERENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Listar meus funcionários',
    description: 'Lista todos os funcionários de todas as propriedades do proprietário/gerente logado.',
  })
  @ApiResponse({ status: 200, description: 'Lista de funcionários retornada com sucesso.' })
  listarMeusFuncionarios(@User() user: any) {
    return this.funcionarioService.listarMeusFuncionarios(user.email);
  }

  @Get('propriedade/:idPropriedade')
  @ApiOperation({
    summary: 'Listar funcionários de uma propriedade',
    description: 'Retorna todos os funcionários vinculados a uma propriedade específica.',
  })
  @ApiResponse({ status: 200, description: 'Lista de funcionários da propriedade retornada.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Você não é proprietário desta propriedade.' })
  listarFuncionariosPorPropriedade(@Param('idPropriedade', ParseIntPipe) idPropriedade: number, @User() user: any) {
    return this.funcionarioService.listarFuncionariosPorPropriedade(idPropriedade, user.email);
  }

  @Delete(':idUsuario/propriedade/:idPropriedade')
  @Roles(Cargo.PROPRIETARIO, Cargo.GERENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Desvincular um funcionário de uma propriedade',
    description: 'Remove o vínculo entre um funcionário e uma propriedade específica.',
  })
  @ApiResponse({ status: 200, description: 'Funcionário desvinculado com sucesso.' })
  desvincularFuncionario(
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @Param('idPropriedade', ParseIntPipe) idPropriedade: number,
    @User() user: any,
  ) {
    return this.funcionarioService.desvincularFuncionario(idUsuario, idPropriedade, user.email);
  }
}
