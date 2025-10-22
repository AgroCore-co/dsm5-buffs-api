import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, UseInterceptors, Query } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { LoggerService } from '../../../core/logger/logger.service';
import { ColetaService } from './coleta.service';
import { CreateColetaDto } from './dto/create-coleta.dto';
import { UpdateColetaDto } from './dto/update-coleta.dto';
import { ColetaPropriedadeResponseDto } from './dto/coleta-propriedade.dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Produção - Coletas de Leite')
@Controller('coletas')
export class ColetaController {
  constructor(
    private readonly service: ColetaService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo registro de coleta de leite' })
  @ApiBody({ type: CreateColetaDto })
  @ApiResponse({ status: 201, description: 'Coleta registrada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() dto: CreateColetaDto, @User('sub') id_funcionario: string) {
    this.logger.logApiRequest('POST', '/coletas', undefined, {
      module: 'ColetaController',
      method: 'create',
      funcionarioId: id_funcionario,
      industriaId: dto.id_industria,
    });
    return this.service.create(dto, id_funcionario);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: 'Lista todas as coletas de leite com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista de coletas retornada com sucesso.' })
  findAll(@Query() paginationDto: PaginationDto) {
    this.logger.logApiRequest('GET', '/coletas', undefined, { module: 'ColetaController', method: 'findAll' });
    return this.service.findAll(paginationDto);
  }

  @Get('propriedade/:id_propriedade')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: 'Lista coletas por propriedade com estatísticas' })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de coletas com nome da empresa e estatísticas retornada com sucesso.',
    type: ColetaPropriedadeResponseDto,
  })
  findByPropriedade(
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<ColetaPropriedadeResponseDto> {
    this.logger.logApiRequest('GET', `/coletas/propriedade/${id_propriedade}`, undefined, {
      module: 'ColetaController',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });
    return this.service.findByPropriedade(id_propriedade, paginationDto);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: 'Busca uma coleta de leite pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da coleta', type: 'string' })
  @ApiResponse({ status: 200, description: 'Coleta encontrada.' })
  @ApiResponse({ status: 404, description: 'Coleta não encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.logApiRequest('GET', `/coletas/${id}`, undefined, { module: 'ColetaController', method: 'findOne', coletaId: id });
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um registro de coleta' })
  @ApiParam({ name: 'id', description: 'ID da coleta a ser atualizada', type: 'string' })
  @ApiBody({ type: UpdateColetaDto })
  @ApiResponse({ status: 200, description: 'Coleta atualizada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Coleta não encontrada.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateColetaDto) {
    this.logger.logApiRequest('PATCH', `/coletas/${id}`, undefined, { module: 'ColetaController', method: 'update', coletaId: id });
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um registro de coleta' })
  @ApiParam({ name: 'id', description: 'ID da coleta a ser removida', type: 'string' })
  @ApiResponse({ status: 200, description: 'Coleta removida com sucesso.' })
  @ApiResponse({ status: 404, description: 'Coleta não encontrada.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.logApiRequest('DELETE', `/coletas/${id}`, undefined, { module: 'ColetaController', method: 'remove', coletaId: id });
    return this.service.remove(id);
  }
}
