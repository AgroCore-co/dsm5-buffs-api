import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { CoberturaService } from './cobertura.service';
import { CreateCoberturaDto } from './dto/create-cobertura.dto';
import { UpdateCoberturaDto } from './dto/update-cobertura.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Reprodução - Cobertura')
@Controller('cobertura') // Rota ajustada para ser mais específica
export class CoberturaController {
  constructor(private readonly service: CoberturaService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo registro de cobertura/inseminação' })
  @ApiBody({ type: CreateCoberturaDto })
  @ApiResponse({ status: 201, description: 'Registro de reprodução criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() dto: CreateCoberturaDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os registros de reprodução' })
  @ApiResponse({ status: 200, description: 'Lista de registros retornada com sucesso.' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um registro de reprodução pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro de reprodução' })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um registro de reprodução' })
  @ApiParam({ name: 'id', description: 'ID do registro a ser atualizado' })
  @ApiBody({ type: UpdateCoberturaDto })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCoberturaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um registro de reprodução' })
  @ApiParam({ name: 'id', description: 'ID do registro a ser removido' })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
