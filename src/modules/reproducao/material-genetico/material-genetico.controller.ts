import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/auth.guard';
import { MaterialGeneticoService } from './material-genetico.service';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Reprodução - Material Genético')
@Controller('material-genetico')
export class MaterialGeneticoController {
  constructor(private readonly service: MaterialGeneticoService) {}

  @Post()
  @ApiOperation({ summary: 'Cria material genético' })
  @ApiResponse({ status: 201, description: 'Material genético criado.' })
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista materiais genéticos' })
  @ApiResponse({ status: 200, description: 'Lista retornada.' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca material genético por ID' })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza material genético' })
  @ApiResponse({ status: 200, description: 'Registro atualizado.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove material genético' })
  @ApiResponse({ status: 200, description: 'Registro removido.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
