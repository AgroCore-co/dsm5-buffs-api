import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, UseInterceptors, Query } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { LoggerService } from '../../../core/logger/logger.service';
import { CicloLactacaoService } from './ciclo-lactacao.service';
import { CreateCicloLactacaoDto, UpdateCicloLactacaoDto } from './dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Produção 1️⃣ - Ciclos de Lactação')
@Controller('ciclos-lactacao')
export class CicloLactacaoController {
  constructor(
    private readonly service: CicloLactacaoService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @ApiOperation({
    summary: '🆕 Iniciar novo ciclo de lactação',
    description: `
**Quando usar:** Logo após a búfala parir.

**O que faz:** 
- Marca o início do período de produção de leite
- Define a data do parto como início do ciclo
- Ativa a búfala para ordenhas (Controle Leiteiro)

**Próximo passo:** Começar a registrar ordenhas em \`POST /lactacao\`
    `,
  })
  @ApiBody({ type: CreateCicloLactacaoDto })
  @ApiResponse({ status: 201, description: 'Ciclo criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() dto: CreateCicloLactacaoDto) {
    this.logger.logApiRequest('POST', '/ciclos-lactacao', undefined, {
      module: 'CicloLactacaoController',
      method: 'create',
      bufalaId: dto.id_bufala,
    });
    return this.service.create(dto);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(900)
  @ApiOperation({
    summary: '📋 Listar todos os ciclos',
    description: 'Lista todos os ciclos de lactação (ativos e encerrados) com paginação.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  findAll(@Query() paginationDto: PaginationDto) {
    this.logger.logApiRequest('GET', '/ciclos-lactacao', undefined, { module: 'CicloLactacaoController', method: 'findAll' });
    return this.service.findAll(paginationDto);
  }

  @Get('propriedade/:id_propriedade')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(900)
  @ApiOperation({
    summary: '🏠 Listar ciclos por propriedade',
    description: 'Lista todos os ciclos de lactação de uma propriedade específica.',
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  findByPropriedade(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @Query() paginationDto: PaginationDto) {
    this.logger.logApiRequest('GET', `/ciclos-lactacao/propriedade/${id_propriedade}`, undefined, {
      module: 'CicloLactacaoController',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });
    return this.service.findByPropriedade(id_propriedade, paginationDto);
  }

  @Get('propriedade/:id_propriedade/estatisticas')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({
    summary: '📊 Estatísticas dos ciclos',
    description: `
**Retorna:**
- Total de ciclos ativos
- Total de ciclos encerrados
- Média de duração dos ciclos
- Produção total por ciclo
    `,
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso.' })
  getEstatisticas(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string) {
    this.logger.logApiRequest('GET', `/ciclos-lactacao/propriedade/${id_propriedade}/estatisticas`, undefined, {
      module: 'CicloLactacaoController',
      method: 'getEstatisticas',
      propriedadeId: id_propriedade,
    });
    return this.service.getEstatisticasPropriedade(id_propriedade);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(900)
  @ApiOperation({
    summary: '🔍 Buscar ciclo específico',
    description: 'Retorna detalhes completos de um ciclo de lactação.',
  })
  @ApiParam({ name: 'id', description: 'ID do ciclo', type: 'string' })
  @ApiResponse({ status: 200, description: 'Ciclo encontrado.' })
  @ApiResponse({ status: 404, description: 'Ciclo não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.logApiRequest('GET', `/ciclos-lactacao/${id}`, undefined, { module: 'CicloLactacaoController', method: 'findOne', cicloId: id });
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '✏️ Atualizar ciclo',
    description: 'Atualiza informações do ciclo (ex: encerrar ciclo definindo data_fim).',
  })
  @ApiParam({ name: 'id', description: 'ID do ciclo a ser atualizado', type: 'string' })
  @ApiBody({ type: UpdateCicloLactacaoDto })
  @ApiResponse({ status: 200, description: 'Ciclo atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Ciclo não encontrado.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCicloLactacaoDto) {
    this.logger.logApiRequest('PATCH', `/ciclos-lactacao/${id}`, undefined, { module: 'CicloLactacaoController', method: 'update', cicloId: id });
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '🗑️ Remover ciclo',
    description: 'Remove um ciclo de lactação (cuidado: pode afetar ordenhas vinculadas).',
  })
  @ApiParam({ name: 'id', description: 'ID do ciclo a ser removido', type: 'string' })
  @ApiResponse({ status: 200, description: 'Ciclo removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Ciclo não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.logApiRequest('DELETE', `/ciclos-lactacao/${id}`, undefined, { module: 'CicloLactacaoController', method: 'remove', cicloId: id });
    return this.service.remove(id);
  }
}
