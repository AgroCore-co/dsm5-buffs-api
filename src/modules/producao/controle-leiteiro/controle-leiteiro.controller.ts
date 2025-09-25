import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, HttpCode, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { LoggerService } from '../../../core/logger/logger.service';
import { ControleLeiteiroService } from './controle-leiteiro.service';
import { CreateDadosLactacaoDto } from './dto/create-dados-lactacao.dto';
import { UpdateDadosLactacaoDto } from './dto/update-dados-lactacao.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Produção - Lactação (Controle Leiteiro)')
@Controller('lactacao')
export class ControleLeiteiroController {
  constructor(
    private readonly service: ControleLeiteiroService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo registro de lactação para o usuário logado' })
  @ApiResponse({ status: 201, description: 'Registro criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou búfala não encontrada.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Perfil do usuário não encontrado.' })
  create(@Body() dto: CreateDadosLactacaoDto, @User() user: any) {
    this.logger.logApiRequest('POST', '/lactacao', undefined, { module: 'ControleLeiteiroController', method: 'create', bufalaId: dto.id_bufala });
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
    this.logger.logApiRequest('GET', '/lactacao', undefined, { module: 'ControleLeiteiroController', method: 'findAll', page: Number(page), limit: Number(limit) });
    return this.service.findAll(Number(page), Number(limit));
  }

  @Get('bufala/:id_bufala')
  @ApiOperation({ summary: 'Busca todos os registros de lactação de uma búfala específica (paginado)' })
  @ApiResponse({ status: 200, description: 'Lista de registros da búfala retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Búfala não encontrada.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Quantidade de registros por página (default: 20)' })
  findAllByBufala(
    @Param('id_bufala', ParseIntPipe) id_bufala: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @User() user: any,
  ) {
    this.logger.logApiRequest('GET', `/lactacao/bufala/${id_bufala}`, undefined, { module: 'ControleLeiteiroController', method: 'findAllByBufala', bufalaId: id_bufala, page: Number(page), limit: Number(limit) });
    return this.service.findAllByBufala(id_bufala, Number(page), Number(limit), user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um registro de lactação específico pelo ID' })
  @ApiResponse({ status: 200, description: 'Dados do registro retornados.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado ou não pertence a este usuário.' })
  findOne(@Param('id', ParseIntPipe) id: number, @User() user: any) {
    this.logger.logApiRequest('GET', `/lactacao/${id}`, undefined, { module: 'ControleLeiteiroController', method: 'findOne', lactacaoId: id });
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um registro de lactação' })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado ou não pertence a este usuário.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDadosLactacaoDto, @User() user: any) {
    this.logger.logApiRequest('PATCH', `/lactacao/${id}`, undefined, { module: 'ControleLeiteiroController', method: 'update', lactacaoId: id });
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Deleta um registro de lactação' })
  @ApiResponse({ status: 204, description: 'Registro deletado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado ou não pertence a este usuário.' })
  remove(@Param('id', ParseIntPipe) id: number, @User() user: any) {
    this.logger.logApiRequest('DELETE', `/lactacao/${id}`, undefined, { module: 'ControleLeiteiroController', method: 'remove', lactacaoId: id });
    return this.service.remove(id, user);
  }
}
