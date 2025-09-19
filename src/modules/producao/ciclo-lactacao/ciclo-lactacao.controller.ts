import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { CicloLactacaoService } from './ciclo-lactacao.service';
import { CreateCicloLactacaoDto } from './dto/create-ciclo-lactacao.dto';
import { UpdateCicloLactacaoDto } from './dto/update-ciclo-lactacao.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Produção - Ciclos de Lactação')
@Controller('ciclos-lactacao')
export class CicloLactacaoController {
  constructor(private readonly service: CicloLactacaoService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo ciclo de lactação' })
  @ApiBody({ type: CreateCicloLactacaoDto })
  @ApiResponse({ status: 201, description: 'Ciclo criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() dto: CreateCicloLactacaoDto) {
    return this.service.create(dto);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(900)
  @ApiOperation({ summary: 'Lista todos os ciclos de lactação' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(900)
  @ApiOperation({ summary: 'Busca um ciclo de lactação pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do ciclo' })
  @ApiResponse({ status: 200, description: 'Ciclo encontrado.' })
  @ApiResponse({ status: 404, description: 'Ciclo não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um ciclo de lactação' })
  @ApiParam({ name: 'id', description: 'ID do ciclo a ser atualizado' })
  @ApiBody({ type: UpdateCicloLactacaoDto })
  @ApiResponse({ status: 200, description: 'Ciclo atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Ciclo não encontrado.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCicloLactacaoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um ciclo de lactação' })
  @ApiParam({ name: 'id', description: 'ID do ciclo a ser removido' })
  @ApiResponse({ status: 200, description: 'Ciclo removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Ciclo não encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}


