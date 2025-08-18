import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/auth.guard';
import { ControleLeiteiroService } from './controle-leiteiro.service';
import { CreateDadosLactacaoDto } from './dto/create-dados-lactacao.dto';
import { UpdateDadosLactacaoDto } from './dto/update-dados-lactacao.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Produção - Lactação (Controle Leiteiro)')
@Controller('lactacao')
export class ControleLeiteiroController {
  constructor(private readonly service: ControleLeiteiroService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um dado de lactação', description: 'Insere um registro na tabela DadosLactacao.' })
  @ApiResponse({ status: 201, description: 'Registro criado com sucesso.' })
  create(@Body() dto: CreateDadosLactacaoDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista dados de lactação', description: 'Lista dados de lactação ordenados por data de ordenha.' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um dado de lactação por ID' })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um dado de lactação' })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDadosLactacaoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um dado de lactação' })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
