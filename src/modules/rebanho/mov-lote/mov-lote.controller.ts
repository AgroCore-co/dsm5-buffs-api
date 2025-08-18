import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/auth.guard';
import { MovLoteService } from './mov-lote.service';
import { CreateMovLoteDto } from './dto/create-mov-lote.dto';
import { UpdateMovLoteDto } from './dto/update-mov-lote.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Rebanho - Movimentação de Lotes')
@Controller('mov-lote')
export class MovLoteController {
  constructor(private readonly service: MovLoteService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo registro de movimentação de lote' })
  @ApiBody({ type: CreateMovLoteDto })
  @ApiResponse({ status: 201, description: 'Movimentação registrada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() dto: CreateMovLoteDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os registros de movimentação' })
  @ApiResponse({ status: 200, description: 'Lista de movimentações retornada com sucesso.' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um registro de movimentação pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro de movimentação' })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um registro de movimentação' })
  @ApiParam({ name: 'id', description: 'ID do registro a ser atualizado' })
  @ApiBody({ type: UpdateMovLoteDto })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMovLoteDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um registro de movimentação' })
  @ApiParam({ name: 'id', description: 'ID do registro a ser removido' })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
