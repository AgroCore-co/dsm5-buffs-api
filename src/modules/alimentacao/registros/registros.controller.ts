import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { RegistrosService } from './registros.service';
import { CreateRegistroAlimentacaoDto } from './dto/create-registro.dto';
import { UpdateRegistroAlimentacaoDto } from './dto/update-registro.dto';
import { SupabaseAuthGuard } from '../../auth/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Alimentação - Registros')
@Controller('alimentacao/registros')
export class RegistrosController {
  constructor(private readonly service: RegistrosService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um registro de alimentação' })
  @ApiResponse({ status: 201, description: 'Registro criado.' })
  create(@Body() dto: CreateRegistroAlimentacaoDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista registros de alimentação' })
  @ApiResponse({ status: 200, description: 'Lista retornada.' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um registro por ID' })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um registro de alimentação' })
  @ApiResponse({ status: 200, description: 'Registro atualizado.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRegistroAlimentacaoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um registro de alimentação' })
  @ApiResponse({ status: 200, description: 'Registro removido.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
