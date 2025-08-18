import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/auth.guard';
import { ColetaService } from './coleta.service';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Produção - Coletas de Leite')
@Controller('coletas')
export class ColetaController {
  constructor(private readonly service: ColetaService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma coleta de leite' })
  @ApiResponse({ status: 201, description: 'Coleta criada com sucesso.' })
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista coletas de leite' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma coleta por ID' })
  @ApiResponse({ status: 200, description: 'Coleta encontrada.' })
  @ApiResponse({ status: 404, description: 'Coleta não encontrada.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma coleta' })
  @ApiResponse({ status: 200, description: 'Coleta atualizada.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma coleta' })
  @ApiResponse({ status: 200, description: 'Coleta removida.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
