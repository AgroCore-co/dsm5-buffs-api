import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { LoggerService } from '../../../core/logger/logger.service';
import { ColetaService } from './coleta.service';
import { CreateColetaDto } from './dto/create-coleta.dto';
import { UpdateColetaDto } from './dto/update-coleta.dto';

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
    this.logger.logApiRequest('POST', '/coletas', undefined, { module: 'ColetaController', method: 'create', funcionarioId: id_funcionario, industriaId: dto.id_industria });
    return this.service.create(dto, id_funcionario);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: 'Lista todas as coletas de leite' })
  @ApiResponse({ status: 200, description: 'Lista de coletas retornada com sucesso.' })
  findAll() {
    this.logger.logApiRequest('GET', '/coletas', undefined, { module: 'ColetaController', method: 'findAll' });
    return this.service.findAll();
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: 'Busca uma coleta de leite pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da coleta' })
  @ApiResponse({ status: 200, description: 'Coleta encontrada.' })
  @ApiResponse({ status: 404, description: 'Coleta não encontrada.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    this.logger.logApiRequest('GET', `/coletas/${id}`, undefined, { module: 'ColetaController', method: 'findOne', coletaId: id });
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um registro de coleta' })
  @ApiParam({ name: 'id', description: 'ID da coleta a ser atualizada' })
  @ApiBody({ type: UpdateColetaDto })
  @ApiResponse({ status: 200, description: 'Coleta atualizada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Coleta não encontrada.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateColetaDto) {
    this.logger.logApiRequest('PATCH', `/coletas/${id}`, undefined, { module: 'ColetaController', method: 'update', coletaId: id });
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um registro de coleta' })
  @ApiParam({ name: 'id', description: 'ID da coleta a ser removida' })
  @ApiResponse({ status: 200, description: 'Coleta removida com sucesso.' })
  @ApiResponse({ status: 404, description: 'Coleta não encontrada.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    this.logger.logApiRequest('DELETE', `/coletas/${id}`, undefined, { module: 'ColetaController', method: 'remove', coletaId: id });
    return this.service.remove(id);
  }
}
