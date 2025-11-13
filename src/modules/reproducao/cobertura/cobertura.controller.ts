import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { CoberturaService } from './cobertura.service';
import {
  CreateCoberturaDto,
  UpdateCoberturaDto,
  FemeaDisponivelReproducaoDto,
  RegistrarPartoDto,
  RecomendacaoFemeaDto,
  RecomendacaoMachoDto,
} from './dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Reprodução - Cobertura')
@Controller('cobertura') // Rota ajustada para ser mais específica
export class CoberturaController {
  constructor(private readonly service: CoberturaService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo registro de cobertura/inseminação' })
  @ApiBody({ type: CreateCoberturaDto })
  @ApiResponse({ status: 201, description: 'Registro de reprodução criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() dto: CreateCoberturaDto, @User('sub') id_usuario: string) {
    return this.service.create(dto, id_usuario);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os registros de reprodução com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista de registros retornada com sucesso.' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.service.findAll(paginationDto);
  }

  @Get('propriedade/:id_propriedade')
  @ApiOperation({ summary: 'Lista coberturas por propriedade com paginação' })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  findByPropriedade(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @Query() paginationDto: PaginationDto) {
    return this.service.findByPropriedade(id_propriedade, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cobertura por ID' })
  @ApiParam({ name: 'id', description: 'ID da cobertura' })
  @ApiResponse({ status: 200, description: 'Cobertura encontrada.' })
  @ApiResponse({ status: 404, description: 'Cobertura não encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar cobertura' })
  @ApiParam({ name: 'id', description: 'ID da cobertura' })
  @ApiBody({ type: UpdateCoberturaDto })
  @ApiResponse({ status: 200, description: 'Cobertura atualizada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Cobertura não encontrada.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCoberturaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover cobertura (soft delete)',
    description: 'Remove logicamente um registro de cobertura sem deletar do banco. Use POST /:id/restore para recuperar.',
  })
  @ApiParam({ name: 'id', description: 'ID da cobertura' })
  @ApiResponse({ status: 200, description: 'Cobertura removida com sucesso.' })
  @ApiResponse({ status: 404, description: 'Cobertura não encontrada.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restaurar cobertura removida',
    description: 'Restaura um registro de cobertura que foi removido com soft delete.',
  })
  @ApiParam({ name: 'id', description: 'ID da cobertura a ser restaurada' })
  @ApiResponse({ status: 200, description: 'Cobertura restaurada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Cobertura não encontrada ou não estava removida.' })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.restore(id);
  }

  @Get('deleted/all')
  @ApiOperation({
    summary: 'Listar coberturas removidas',
    description: 'Lista todos os registros de cobertura incluindo os removidos (soft delete).',
  })
  @ApiResponse({ status: 200, description: 'Lista de coberturas incluindo deletadas retornada com sucesso.' })
  findAllWithDeleted() {
    return this.service.findAllWithDeleted();
  }

  @Get('femeas/disponiveis-reproducao/:id_propriedade')
  @ApiOperation({ summary: 'Lista fêmeas disponíveis para reprodução' })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiQuery({
    name: 'filtro',
    required: false,
    enum: ['todas', 'solteiras', 'vazias', 'aptas'],
    description: 'todas = todas fêmeas | solteiras = sem cobertura | vazias = cobertura falhou | aptas = prontas para cobrir',
  })
  @ApiResponse({
    status: 200,
    description: 'Fêmeas disponíveis para reprodução',
    type: [FemeaDisponivelReproducaoDto],
  })
  async getFemeasDisponiveisReproducao(
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @Query('filtro') filtro: 'todas' | 'solteiras' | 'vazias' | 'aptas' = 'aptas',
  ): Promise<FemeaDisponivelReproducaoDto[]> {
    return this.service.findFemeasDisponiveisReproducao(id_propriedade, filtro);
  }

  @Patch(':id/registrar-parto')
  @ApiOperation({ summary: 'Registra parto e cria novo ciclo de lactação automaticamente' })
  @ApiParam({ name: 'id', description: 'ID da cobertura', type: 'string' })
  @ApiBody({ type: RegistrarPartoDto })
  @ApiResponse({
    status: 200,
    description: 'Parto registrado e ciclo criado (se aplicável)',
    schema: {
      type: 'object',
      properties: {
        cobertura: { type: 'object', description: 'Dados atualizados da cobertura' },
        ciclo_lactacao: { type: 'object', nullable: true, description: 'Ciclo criado (se aplicável)' },
        message: { type: 'string', example: 'Parto registrado e ciclo de lactação criado com sucesso' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Cobertura não está confirmada ou dados inválidos' })
  @ApiResponse({ status: 404, description: 'Cobertura não encontrada' })
  registrarParto(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RegistrarPartoDto) {
    return this.service.registrarParto(id, dto);
  }

  @Get('recomendacoes/femeas/:id_propriedade')
  @ApiOperation({
    summary: 'Retorna ranking de fêmeas recomendadas para acasalamento',
    description: `Calcula score de prioridade baseado em critérios zootécnicos:
    - Experiência reprodutiva (0-50 pts)
    - Intervalo reprodutivo adequado (0-25 pts)
    - Idade ideal (0-20 pts)
    - Ausência de restrições (0-15 pts)
    - Status de lactação (0-10 pts)
    
    Retorna lista ordenada por score decrescente (0-100).`,
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limitar quantidade de resultados (ex: top 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Ranking de fêmeas retornado com sucesso',
    type: [RecomendacaoFemeaDto],
  })
  async getRecomendacoesFemeas(
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @Query('limit') limit?: number,
  ): Promise<RecomendacaoFemeaDto[]> {
    return this.service.findRecomendacoesFemeas(id_propriedade, limit);
  }

  @Get('recomendacoes/machos/:id_propriedade')
  @ApiOperation({
    summary: 'Retorna ranking de machos recomendados para acasalamento',
    description: `Calcula score de prioridade baseado em critérios:
    - Idade e maturidade (0-25 pts)
    - Histórico de acasalamentos (0-25 pts)
    - Taxa de sucesso (0-30 pts)
    - Intervalo de descanso (0-10 pts)
    - Qualidade genética ABCB (0-10 pts)
    
    Retorna lista ordenada por score decrescente (0-100).
    
    NOTA: Critérios em validação - podem ser ajustados conforme orientação zootécnica.`,
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limitar quantidade de resultados (ex: top 5)',
  })
  @ApiResponse({
    status: 200,
    description: 'Ranking de machos retornado com sucesso',
    type: [RecomendacaoMachoDto],
  })
  async getRecomendacoesMachos(
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @Query('limit') limit?: number,
  ): Promise<RecomendacaoMachoDto[]> {
    return this.service.findRecomendacoesMachos(id_propriedade, limit);
  }
}
