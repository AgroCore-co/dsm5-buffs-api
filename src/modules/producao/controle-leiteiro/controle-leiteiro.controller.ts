import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, HttpCode, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { ControleLeiteiroService } from './controle-leiteiro.service';
import { CreateDadosLactacaoDto } from './dto/create-dados-lactacao.dto';
import { UpdateDadosLactacaoDto } from './dto/update-dados-lactacao.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Produção - Lactação (Controle Leiteiro)')
@Controller('lactacao')
export class ControleLeiteiroController {
  constructor(private readonly service: ControleLeiteiroService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo registro de lactação para o usuário logado' })
  @ApiResponse({ status: 201, description: 'Registro criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou búfala não encontrada.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Perfil do usuário não encontrado.' })
  create(@Body() dto: CreateDadosLactacaoDto, @User() user: any) {
    return this.service.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os registros de lactação (paginado)' })
  @ApiResponse({ status: 200, description: 'Lista de registros retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 400, description: 'Parâmetros de paginação inválidos.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Quantidade de registros por página (default: 20)' })
  findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.service.findAll(Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um registro de lactação específico pelo ID' })
  @ApiResponse({ status: 200, description: 'Dados do registro retornados.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado ou não pertence a este usuário.' })
  findOne(@Param('id', ParseIntPipe) id: number, @User() user: any) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um registro de lactação' })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado ou não pertence a este usuário.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDadosLactacaoDto, @User() user: any) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Deleta um registro de lactação' })
  @ApiResponse({ status: 204, description: 'Registro deletado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado ou não pertence a este usuário.' })
  remove(@Param('id', ParseIntPipe) id: number, @User() user: any) {
    return this.service.remove(id, user);
  }
}
