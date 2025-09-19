import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { MaterialGeneticoService } from './material-genetico.service';
import { CreateMaterialGeneticoDto } from './dto/create-material-genetico.dto';
import { UpdateMaterialGeneticoDto } from './dto/update-material-genetico.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Reprodução - Material Genético')
@Controller('material-genetico')
export class MaterialGeneticoController {
  constructor(private readonly service: MaterialGeneticoService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo registro de material genético' })
  @ApiBody({ type: CreateMaterialGeneticoDto })
  @ApiResponse({ status: 201, description: 'Material genético criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() dto: CreateMaterialGeneticoDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os materiais genéticos disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de materiais retornada com sucesso.' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um material genético pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do material genético' })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um registro de material genético' })
  @ApiParam({ name: 'id', description: 'ID do registro a ser atualizado' })
  @ApiBody({ type: UpdateMaterialGeneticoDto })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMaterialGeneticoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um registro de material genético' })
  @ApiParam({ name: 'id', description: 'ID do registro a ser removido' })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
