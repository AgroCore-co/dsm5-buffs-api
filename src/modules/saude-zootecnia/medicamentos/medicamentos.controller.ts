import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { MedicamentosService } from './medicamentos.service';
import { CreateMedicacaoDto } from './dto/create-medicacao.dto';
import { UpdateMedicacaoDto } from './dto/update-medicacao.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Saúde/Zootecnia - Medicamentos')
@Controller('medicamentos')
export class MedicamentosController {
  constructor(private readonly service: MedicamentosService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova medicação' })
  @ApiResponse({ status: 201, description: 'Medicação criada com sucesso.' })
  create(@Body() dto: CreateMedicacaoDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as medicações' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  findAll() {
    return this.service.findAll();
  }

  @Get('propriedade/:id_propriedade')
  @ApiOperation({ summary: 'Lista todas as medicações de uma propriedade específica' })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiResponse({ status: 200, description: 'Lista de medicações da propriedade retornada com sucesso.' })
  findByPropriedade(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string) {
    return this.service.findByPropriedade(id_propriedade);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma medicação pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da medicação', type: 'string' })
  @ApiResponse({ status: 200, description: 'Medicação encontrada.' })
  @ApiResponse({ status: 404, description: 'Medicação não encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma medicação' })
  @ApiParam({ name: 'id', description: 'ID da medicação a ser atualizada', type: 'string' })
  @ApiResponse({ status: 200, description: 'Medicação atualizada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Medicação não encontrada.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMedicacaoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma medicação' })
  @ApiParam({ name: 'id', description: 'ID da medicação a ser removida', type: 'string' })
  @ApiResponse({ status: 200, description: 'Medicação removida com sucesso.' })
  @ApiResponse({ status: 404, description: 'Medicação não encontrada.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
