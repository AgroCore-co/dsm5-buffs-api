import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, UseInterceptors, Query } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { LoggerService } from '../../../core/logger/logger.service';
import { ColetaService } from './coleta.service';
import { CreateColetaDto, UpdateColetaDto, ColetaPropriedadeResponseDto } from './dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Produção 4️⃣ - Coletas de Leite')
@Controller('coletas')
export class ColetaController {
  constructor(
    private readonly service: ColetaService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @ApiOperation({
    summary: '🚚 Registrar coleta do laticínio',
    description: `
**Quando usar:** Quando o caminhão do laticínio vem buscar o leite.

**O que registra:**
- Quantidade coletada
- Empresa que coletou
- Data e hora da coleta
- Valor pago (opcional)
- Reduz o estoque disponível

**Pré-requisito:** Ter estoque disponível em \`POST /estoque-leite\`

**Efeito:** Diminui quantidade disponível no estoque
    `,
  })
  @ApiBody({ type: CreateColetaDto })
  @ApiResponse({ status: 201, description: 'Coleta registrada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou estoque insuficiente.' })
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
  @ApiOperation({
    summary: '📋 Listar todas as coletas',
    description: 'Histórico completo de coletas realizadas.',
  })
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
  @ApiOperation({
    summary: '🏠 Coletas por propriedade',
    description: `
**Retorna:**
- Histórico de coletas
- Nome do laticínio
- Valores totais coletados
- Estatísticas de vendas
    `,
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de coletas com estatísticas.',
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
  @ApiOperation({
    summary: '🔍 Buscar coleta específica',
    description: 'Retorna detalhes completos de uma coleta.',
  })
  @ApiParam({ name: 'id', description: 'ID da coleta', type: 'string' })
  @ApiResponse({ status: 200, description: 'Coleta encontrada.' })
  @ApiResponse({ status: 404, description: 'Coleta não encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.logApiRequest('GET', `/coletas/${id}`, undefined, { module: 'ColetaController', method: 'findOne', coletaId: id });
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '✏️ Atualizar coleta',
    description: 'Corrige dados de uma coleta (quantidade, valor, etc).',
  })
  @ApiParam({ name: 'id', description: 'ID da coleta a ser atualizada', type: 'string' })
  @ApiBody({ type: UpdateColetaDto })
  @ApiResponse({ status: 200, description: 'Coleta atualizada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Coleta não encontrada.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateColetaDto) {
    this.logger.logApiRequest('PATCH', `/coletas/${id}`, undefined, { module: 'ColetaController', method: 'update', coletaId: id });
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '🗑️ Remover coleta',
    description: 'Cancela uma coleta (atenção: restitui estoque).',
  })
  @ApiParam({ name: 'id', description: 'ID da coleta a ser removida', type: 'string' })
  @ApiResponse({ status: 200, description: 'Coleta removida com sucesso.' })
  @ApiResponse({ status: 404, description: 'Coleta não encontrada.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.logApiRequest('DELETE', `/coletas/${id}`, undefined, { module: 'ColetaController', method: 'remove', coletaId: id });
    return this.service.remove(id);
  }
}
