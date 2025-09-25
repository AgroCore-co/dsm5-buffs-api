import { Controller, Get, Post, Body, UseGuards, Param, Patch, Delete, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { RacaService } from './raca.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateRacaDto } from './dto/create-raca.dto';
import { UpdateRacaDto } from './dto/update-raca.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Rebanho - Raças')
@Controller('racas')
export class RacaController {
  constructor(
    private readonly racaService: RacaService,
    private readonly logger: LoggerService,
  ) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600000) // 1 hora - raças são dados estáticos
  @ApiOperation({
    summary: 'Lista todas as raças',
    description: 'Retorna uma lista de todas as raças de búfalos cadastradas no sistema, ordenadas alfabeticamente.',
  })
  @ApiResponse({ status: 200, description: 'Lista de raças retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  findAll() {
    this.logger.logApiRequest('GET', '/racas', undefined, { module: 'RacaController', method: 'findAll' });
    return this.racaService.findAll();
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600000) // 1 hora
  @ApiOperation({
    summary: 'Busca uma raça específica',
    description: 'Retorna os dados de uma raça específica pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID da raça', type: 'number' })
  @ApiResponse({ status: 200, description: 'Raça encontrada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Raça não encontrada.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    this.logger.logApiRequest('GET', `/racas/${id}`, undefined, { module: 'RacaController', method: 'findOne', racaId: id });
    return this.racaService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Cria uma nova raça',
    description: 'Cria um novo registro de raça no banco de dados. Retorna a raça completa com o ID gerado.',
  })
  @ApiResponse({ status: 201, description: 'Raça criada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  create(@Body() createRacaDto: CreateRacaDto) {
    this.logger.logApiRequest('POST', '/racas', undefined, { module: 'RacaController', method: 'create' });
    return this.racaService.create(createRacaDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza uma raça',
    description: 'Atualiza os dados de uma raça específica pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID da raça', type: 'number' })
  @ApiResponse({ status: 200, description: 'Raça atualizada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Raça não encontrada.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateRacaDto: UpdateRacaDto) {
    this.logger.logApiRequest('PATCH', `/racas/${id}`, undefined, { module: 'RacaController', method: 'update', racaId: id });
    return this.racaService.update(id, updateRacaDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove uma raça',
    description: 'Remove uma raça específica do sistema pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID da raça', type: 'number' })
  @ApiResponse({ status: 200, description: 'Raça removida com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Raça não encontrada.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    this.logger.logApiRequest('DELETE', `/racas/${id}`, undefined, { module: 'RacaController', method: 'remove', racaId: id });
    return this.racaService.remove(id);
  }
}
