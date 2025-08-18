import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/auth.guard';
import { IndustriaService } from './industria.service';
import { CreateIndustriaDto } from './dto/create-industria.dto';
import { UpdateIndustriaDto } from './dto/update-industria.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Produção - Indústrias')
@Controller('industrias')
export class IndustriaController {
  constructor(private readonly service: IndustriaService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova indústria' })
  @ApiBody({ type: CreateIndustriaDto })
  @ApiResponse({ status: 201, description: 'Indústria criada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() dto: CreateIndustriaDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as indústrias cadastradas' })
  @ApiResponse({ status: 200, description: 'Lista de indústrias retornada com sucesso.' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma indústria pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da indústria' })
  @ApiResponse({ status: 200, description: 'Indústria encontrada.' })
  @ApiResponse({ status: 404, description: 'Indústria não encontrada.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza os dados de uma indústria' })
  @ApiParam({ name: 'id', description: 'ID da indústria a ser atualizada' })
  @ApiBody({ type: UpdateIndustriaDto })
  @ApiResponse({ status: 200, description: 'Indústria atualizada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Indústria não encontrada.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIndustriaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma indústria' })
  @ApiParam({ name: 'id', description: 'ID da indústria a ser removida' })
  @ApiResponse({ status: 200, description: 'Indústria removida com sucesso.' })
  @ApiResponse({ status: 404, description: 'Indústria não encontrada.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
