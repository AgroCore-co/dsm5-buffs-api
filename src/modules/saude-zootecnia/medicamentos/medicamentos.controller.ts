import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/auth.guard';
import { MedicamentosService } from './medicamentos.service';
import { CreateDadosSanitariosDto } from './dto/create-dados-sanitarios.dto';
import { UpdateDadosSanitariosDto } from './dto/update-dados-sanitarios.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Saúde/Zootecnia - Dados Sanitários')
@Controller('dados-sanitarios')
export class MedicamentosController {
  constructor(private readonly service: MedicamentosService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um registro sanitário', description: 'Cria um registro na tabela DadosSanitarios.' })
  @ApiResponse({ status: 201, description: 'Registro criado com sucesso.' })
  create(@Body() dto: CreateDadosSanitariosDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista registros sanitários', description: 'Lista todos os registros sanitários ordenados por criação.' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém um registro sanitário', description: 'Busca um registro sanitário por id_sanit.' })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um registro sanitário' })
  @ApiResponse({ status: 200, description: 'Registro atualizado.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDadosSanitariosDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um registro sanitário' })
  @ApiResponse({ status: 200, description: 'Registro removido.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
