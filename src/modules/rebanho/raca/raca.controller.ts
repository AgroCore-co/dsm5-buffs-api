import { Controller, Get, Post, Body, UseGuards, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { RacaService } from './raca.service';
import { CreateRacaDto } from './dto/create-raca.dto';
import { UpdateRacaDto } from './dto/update-raca.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/auth.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Rebanho - Raças')
@Controller('racas')
export class RacaController {
  constructor(private readonly racaService: RacaService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista todas as raças',
    description: 'Retorna uma lista de todas as raças de búfalos cadastradas no sistema, ordenadas alfabeticamente.',
  })
  @ApiResponse({ status: 200, description: 'Lista de raças retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  findAll() {
    return this.racaService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca uma raça específica',
    description: 'Retorna os dados de uma raça específica pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID da raça', type: 'number' })
  @ApiResponse({ status: 200, description: 'Raça encontrada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Raça não encontrada.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.racaService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Cria uma nova raça',
    description: 'Cria um novo registro de raça no banco de dados. Retorna a raça completa com o ID gerado.',
  })
  @ApiResponse({ status: 201, description: 'Raça criada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  create(@Body() createRacaDto: CreateRacaDto) {
    return this.racaService.create(createRacaDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza uma raça',
    description: 'Atualiza os dados de uma raça específica pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID da raça', type: 'number' })
  @ApiResponse({ status: 200, description: 'Raça atualizada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Raça não encontrada.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRacaDto: UpdateRacaDto,
  ) {
    return this.racaService.update(id, updateRacaDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove uma raça',
    description: 'Remove uma raça específica do sistema pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID da raça', type: 'number' })
  @ApiResponse({ status: 200, description: 'Raça removida com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Raça não encontrada.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.racaService.remove(id);
  }
}
