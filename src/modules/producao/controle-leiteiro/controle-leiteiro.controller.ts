import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, HttpCode, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { LoggerService } from '../../../core/logger/logger.service';
import { ControleLeiteiroService } from './controle-leiteiro.service';
import { CreateDadosLactacaoDto } from './dto/create-dados-lactacao.dto';
import { UpdateDadosLactacaoDto } from './dto/update-dados-lactacao.dto';
import { FemeaEmLactacaoDto } from './dto/femea-em-lactacao.dto';
import { ResumoProducaoBufalaDto } from './dto/resumo-producao-bufala.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Produção 2️⃣ - Controle Leiteiro (Ordenhas)')
@Controller('lactacao')
export class ControleLeiteiroController {
  constructor(
    private readonly service: ControleLeiteiroService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @ApiOperation({
    summary: '🥛 Registrar ordenha individual',
    description: `
**Quando usar:** A cada ordenha realizada (2-3x por dia).

**O que registra:**
- Quantidade de leite produzida por búfala
- Horário da ordenha
- Período (manhã, tarde, noite)
- Qualidade do leite (opcional)

**Pré-requisito:** Búfala deve ter um ciclo de lactação ATIVO.

**Próximo passo:** No fim do dia, consolidar em \`POST /estoque-leite\`
    `,
  })
  @ApiResponse({ status: 201, description: 'Ordenha registrada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou búfala não está em lactação.' })
  create(@Body() dto: CreateDadosLactacaoDto, @User() user: any) {
    this.logger.logApiRequest('POST', '/lactacao', undefined, { module: 'ControleLeiteiroController', method: 'create', bufalaId: dto.id_bufala });
    return this.service.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary: '📋 Listar todas as ordenhas',
    description: 'Lista histórico completo de ordenhas com paginação.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Quantidade de registros por página (default: 20)' })
  @ApiResponse({ status: 200, description: 'Lista de registros retornada com sucesso.' })
  findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    this.logger.logApiRequest('GET', '/lactacao', undefined, {
      module: 'ControleLeiteiroController',
      method: 'findAll',
      page: Number(page),
      limit: Number(limit),
    });
    return this.service.findAll(Number(page), Number(limit));
  }

  @Get('bufala/:id_bufala')
  @ApiOperation({
    summary: '🐃 Histórico de ordenhas por búfala',
    description: 'Lista todas as ordenhas de uma búfala específica.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Quantidade de registros por página (default: 20)' })
  findAllByBufala(
    @Param('id_bufala', ParseUUIDPipe) id_bufala: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @User() user: any,
  ) {
    this.logger.logApiRequest('GET', `/lactacao/bufala/${id_bufala}`, undefined, {
      module: 'ControleLeiteiroController',
      method: 'findAllByBufala',
      bufalaId: id_bufala,
      page: Number(page),
      limit: Number(limit),
    });
    return this.service.findAllByBufala(id_bufala, Number(page), Number(limit), user);
  }

  @Get('ciclo/:id_ciclo_lactacao')
  @ApiOperation({
    summary: '🔄 Ordenhas por ciclo de lactação',
    description: 'Lista todas as ordenhas de um ciclo específico.',
  })
  @ApiParam({ name: 'id_ciclo_lactacao', description: 'ID do ciclo de lactação', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Quantidade de registros por página (default: 20)' })
  findAllByCiclo(
    @Param('id_ciclo_lactacao', ParseUUIDPipe) id_ciclo_lactacao: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @User() user: any,
  ) {
    this.logger.logApiRequest('GET', `/lactacao/ciclo/${id_ciclo_lactacao}`, undefined, {
      module: 'ControleLeiteiroController',
      method: 'findAllByCiclo',
      cicloId: id_ciclo_lactacao,
      page: Number(page),
      limit: Number(limit),
    });
    return this.service.findAllByCiclo(id_ciclo_lactacao, Number(page), Number(limit), user);
  }

  @Get(':id')
  @ApiOperation({
    summary: '🔍 Buscar ordenha específica',
    description: 'Retorna detalhes de uma ordenha pelo ID.',
  })
  @ApiResponse({ status: 200, description: 'Dados do registro retornados.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    this.logger.logApiRequest('GET', `/lactacao/${id}`, undefined, { module: 'ControleLeiteiroController', method: 'findOne', lactacaoId: id });
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '✏️ Atualizar ordenha',
    description: 'Corrige dados de uma ordenha registrada (quantidade, horário, etc).',
  })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDadosLactacaoDto, @User() user: any) {
    this.logger.logApiRequest('PATCH', `/lactacao/${id}`, undefined, { module: 'ControleLeiteiroController', method: 'update', lactacaoId: id });
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: '🗑️ Remover ordenha',
    description: 'Remove um registro de ordenha (cuidado: afeta estatísticas).',
  })
  @ApiResponse({ status: 204, description: 'Registro deletado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    this.logger.logApiRequest('DELETE', `/lactacao/${id}`, undefined, { module: 'ControleLeiteiroController', method: 'remove', lactacaoId: id });
    return this.service.remove(id, user);
  }

  @Get('femeas/em-lactacao/:id_propriedade')
  @ApiOperation({
    summary: '📋 Listar búfalas disponíveis para ordenha',
    description: `
**Retorna:** Todas as búfalas com ciclo de lactação ATIVO.

**Use antes de:** Registrar uma nova ordenha para ver quais búfalas podem ser ordenhadas.
    `,
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiResponse({ status: 200, description: 'Fêmeas em lactação com dados de produção', type: [FemeaEmLactacaoDto] })
  async getFemeasEmLactacao(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string): Promise<FemeaEmLactacaoDto[]> {
    this.logger.logApiRequest('GET', `/lactacao/femeas/em-lactacao/${id_propriedade}`, undefined, {
      module: 'ControleLeiteiroController',
      method: 'getFemeasEmLactacao',
      propriedadeId: id_propriedade,
    });
    return this.service.findFemeasEmLactacao(id_propriedade);
  }

  @Get('bufala/:id/resumo-producao')
  @ApiOperation({
    summary: '📊 Resumo de produção por búfala',
    description: `
**Retorna:**
- Dados do ciclo atual
- Produção total do ciclo
- Média diária de produção
- Histórico de ciclos anteriores
    `,
  })
  @ApiParam({ name: 'id', description: 'ID da búfala', type: 'string' })
  @ApiResponse({ status: 200, description: 'Resumo completo de produção', type: ResumoProducaoBufalaDto })
  async getResumoProducaoBufala(@Param('id', ParseUUIDPipe) id: string, @User() user: any): Promise<ResumoProducaoBufalaDto> {
    this.logger.logApiRequest('GET', `/lactacao/bufala/${id}/resumo-producao`, undefined, {
      module: 'ControleLeiteiroController',
      method: 'getResumoProducaoBufala',
      bufalaId: id,
    });
    return this.service.getResumoProducaoBufala(id, user);
  }
}
