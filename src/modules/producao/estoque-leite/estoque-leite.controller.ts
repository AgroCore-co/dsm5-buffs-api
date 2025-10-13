import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { LoggerService } from '../../../core/logger/logger.service';
import { EstoqueLeiteService } from './estoque-leite.service';
import { CreateEstoqueLeiteDto } from './dto/create-estoque-leite.dto';
import { UpdateEstoqueLeiteDto } from './dto/update-estoque-leite.dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Produção - Estoque de Leite')
@Controller('estoque-leite')
export class EstoqueLeiteController {
  constructor(
    private readonly service: EstoqueLeiteService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo registro de estoque de leite' })
  @ApiBody({ type: CreateEstoqueLeiteDto })
  @ApiResponse({ status: 201, description: 'Registro de estoque criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() dto: CreateEstoqueLeiteDto, @User('sub') id_usuario: string) {
    this.logger.logApiRequest('POST', '/estoque-leite', undefined, {
      module: 'EstoqueLeiteController',
      method: 'create',
      usuarioId: id_usuario,
      propriedadeId: dto.id_propriedade,
    });
    return this.service.create(dto, id_usuario);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os registros de estoque de leite com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista de registros retornada com sucesso.' })
  findAll(@Query() paginationDto: PaginationDto) {
    this.logger.logApiRequest('GET', '/estoque-leite', undefined, { module: 'EstoqueLeiteController', method: 'findAll' });
    return this.service.findAll(paginationDto);
  }

  @Get('propriedade/:id_propriedade')
  @ApiOperation({ summary: 'Lista registros de estoque por propriedade com paginação' })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista de registros retornada com sucesso.' })
  findByPropriedade(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @Query() paginationDto: PaginationDto) {
    this.logger.logApiRequest('GET', `/estoque-leite/propriedade/${id_propriedade}`, undefined, {
      module: 'EstoqueLeiteController',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });
    return this.service.findByPropriedade(id_propriedade, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um registro de estoque pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro de estoque', type: 'string' })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.logApiRequest('GET', `/estoque-leite/${id}`, undefined, { module: 'EstoqueLeiteController', method: 'findOne', estoqueId: id });
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um registro de estoque' })
  @ApiParam({ name: 'id', description: 'ID do registro a ser atualizado', type: 'string' })
  @ApiBody({ type: UpdateEstoqueLeiteDto })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEstoqueLeiteDto) {
    this.logger.logApiRequest('PATCH', `/estoque-leite/${id}`, undefined, { module: 'EstoqueLeiteController', method: 'update', estoqueId: id });
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um registro de estoque' })
  @ApiParam({ name: 'id', description: 'ID do registro a ser removido', type: 'string' })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.logApiRequest('DELETE', `/estoque-leite/${id}`, undefined, { module: 'EstoqueLeiteController', method: 'remove', estoqueId: id });
    return this.service.remove(id);
  }
}
