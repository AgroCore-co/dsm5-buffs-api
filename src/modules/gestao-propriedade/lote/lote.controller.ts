import { Controller, Get, Post, Body, UseGuards, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { LoteService } from './lote.service';
import { CreateLoteDto } from './dto/create-lote.dto';
import { UpdateLoteDto } from './dto/update-lote.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/auth.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Gestão de Propriedade - Lotes (Piquetes)')
@Controller('lotes')
export class LoteController {
  constructor(private readonly loteService: LoteService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista todos os lotes (piquetes) georreferenciados',
    description: 'Retorna uma lista de todos os lotes cadastrados no sistema, ordenados por data de criação.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de lotes retornada com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  findAll() {
    return this.loteService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca um lote específico',
    description: 'Retorna os dados de um lote específico pelo ID, incluindo a geometria GeoJSON.',
  })
  @ApiParam({ name: 'id', description: 'ID do lote', type: 'number' })
  @ApiResponse({ status: 200, description: 'Lote encontrado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Lote não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.loteService.findOne(id);
  }

  @Get('propriedade/:id_propriedade')
  @ApiOperation({
    summary: 'Lista todos os lotes de uma propriedade específica',
    description: 'Retorna uma lista de todos os lotes cadastrados para uma propriedade, ordenados por data de criação.',
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade à qual os lotes pertencem', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Lista de lotes da propriedade retornada com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  findAllByPropriedade(@Param('id_propriedade', ParseIntPipe) id_propriedade: number) {
    return this.loteService.findAllByPropriedade(id_propriedade);
  }

  @Post()
  @ApiOperation({
    summary: 'Cria um novo lote (piquete) com dados geográficos',
    description: 'Cria um novo registro de lote no banco de dados com geometria GeoJSON. Retorna o lote completo com o ID gerado.',
  })
  @ApiResponse({ status: 201, description: 'Lote criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  create(@Body() createLoteDto: CreateLoteDto) {
    return this.loteService.create(createLoteDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza um lote',
    description: 'Atualiza os dados de um lote específico pelo ID, incluindo a geometria se fornecida.',
  })
  @ApiParam({ name: 'id', description: 'ID do lote', type: 'number' })
  @ApiResponse({ status: 200, description: 'Lote atualizado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Lote não encontrado.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateLoteDto: UpdateLoteDto) {
    return this.loteService.update(id, updateLoteDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove um lote',
    description: 'Remove um lote específico do sistema pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID do lote', type: 'number' })
  @ApiResponse({ status: 200, description: 'Lote removido com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Lote não encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.loteService.remove(id);
  }
}
