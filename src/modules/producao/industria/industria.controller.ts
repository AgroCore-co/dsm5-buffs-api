import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { LoggerService } from '../../../core/logger/logger.service';
import { IndustriaService } from './industria.service';
import { CreateIndustriaDto } from './dto/create-industria.dto';
import { UpdateIndustriaDto } from './dto/update-industria.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Produção - Indústrias')
@Controller('industrias')
export class IndustriaController {
  constructor(
    private readonly service: IndustriaService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova indústria' })
  @ApiBody({ type: CreateIndustriaDto })
  @ApiResponse({ status: 201, description: 'Indústria criada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() dto: CreateIndustriaDto) {
    this.logger.logApiRequest('POST', '/industrias', undefined, { module: 'IndustriaController', method: 'create', nome: dto.nome });
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as indústrias cadastradas' })
  @ApiResponse({ status: 200, description: 'Lista de indústrias retornada com sucesso.' })
  findAll() {
    this.logger.logApiRequest('GET', '/industrias', undefined, { module: 'IndustriaController', method: 'findAll' });
    return this.service.findAll();
  }

  @Get('propriedade/:id_propriedade')
  @ApiOperation({ summary: 'Lista as indústrias associadas a uma propriedade específica' })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade (UUID)', type: 'string', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @ApiResponse({ status: 200, description: 'Lista de indústrias da propriedade retornada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada.' })
  findByPropriedade(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string) {
    this.logger.logApiRequest('GET', `/industrias/propriedade/${id_propriedade}`, undefined, {
      module: 'IndustriaController',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });
    return this.service.findByPropriedade(id_propriedade);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma indústria pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da indústria', type: 'string' })
  @ApiResponse({ status: 200, description: 'Indústria encontrada.' })
  @ApiResponse({ status: 404, description: 'Indústria não encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.logApiRequest('GET', `/industrias/${id}`, undefined, { module: 'IndustriaController', method: 'findOne', industriaId: id });
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza os dados de uma indústria' })
  @ApiParam({ name: 'id', description: 'ID da indústria a ser atualizada', type: 'string' })
  @ApiBody({ type: UpdateIndustriaDto })
  @ApiResponse({ status: 200, description: 'Indústria atualizada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Indústria não encontrada.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateIndustriaDto) {
    this.logger.logApiRequest('PATCH', `/industrias/${id}`, undefined, { module: 'IndustriaController', method: 'update', industriaId: id });
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma indústria' })
  @ApiParam({ name: 'id', description: 'ID da indústria a ser removida', type: 'string' })
  @ApiResponse({ status: 200, description: 'Indústria removida com sucesso.' })
  @ApiResponse({ status: 404, description: 'Indústria não encontrada.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.logApiRequest('DELETE', `/industrias/${id}`, undefined, { module: 'IndustriaController', method: 'remove', industriaId: id });
    return this.service.remove(id);
  }
}
