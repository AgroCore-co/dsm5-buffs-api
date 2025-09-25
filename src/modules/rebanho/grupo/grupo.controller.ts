import { Controller, Get, Post, Body, UseGuards, Param, Patch, Delete, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { GrupoService } from './grupo.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Rebanho - Grupos')
@Controller('grupos')
export class GrupoController {
  constructor(
    private readonly grupoService: GrupoService,
    private readonly logger: LoggerService,
  ) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  @ApiOperation({
    summary: 'Lista todos os grupos',
    description: 'Retorna uma lista de todos os grupos de búfalos cadastrados no sistema, ordenados alfabeticamente.',
  })
  @ApiResponse({ status: 200, description: 'Lista de grupos retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  findAll() {
    this.logger.logApiRequest('GET', '/grupos', undefined, { module: 'GrupoController', method: 'findAll' });
    return this.grupoService.findAll();
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  @ApiOperation({
    summary: 'Busca um grupo específico',
    description: 'Retorna os dados de um grupo específico pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID do grupo', type: 'number' })
  @ApiResponse({ status: 200, description: 'Grupo encontrado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Grupo não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    this.logger.logApiRequest('GET', `/grupos/${id}`, undefined, { module: 'GrupoController', method: 'findOne', grupoId: id });
    return this.grupoService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Cria um novo grupo',
    description: 'Cria um novo registro de grupo no banco de dados. Retorna o grupo completo com o ID gerado.',
  })
  @ApiResponse({ status: 201, description: 'Grupo criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  create(@Body() createGrupoDto: CreateGrupoDto) {
    this.logger.logApiRequest('POST', '/grupos', undefined, { module: 'GrupoController', method: 'create' });
    return this.grupoService.create(createGrupoDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza um grupo',
    description: 'Atualiza os dados de um grupo específico pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID do grupo', type: 'number' })
  @ApiResponse({ status: 200, description: 'Grupo atualizado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Grupo não encontrado.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateGrupoDto: UpdateGrupoDto) {
    this.logger.logApiRequest('PATCH', `/grupos/${id}`, undefined, { module: 'GrupoController', method: 'update', grupoId: id });
    return this.grupoService.update(id, updateGrupoDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove um grupo',
    description: 'Remove um grupo específico do sistema pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID do grupo', type: 'number' })
  @ApiResponse({ status: 200, description: 'Grupo removido com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Grupo não encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    this.logger.logApiRequest('DELETE', `/grupos/${id}`, undefined, { module: 'GrupoController', method: 'remove', grupoId: id });
    return this.grupoService.remove(id);
  }
}
