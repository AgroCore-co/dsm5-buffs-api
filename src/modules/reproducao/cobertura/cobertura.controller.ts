import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { CoberturaService } from './cobertura.service';
import { CreateCoberturaDto } from './dto/create-cobertura.dto';
import { UpdateCoberturaDto } from './dto/update-cobertura.dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';

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
  create(@Body() dto: CreateCoberturaDto, @User('sub') id_usuario: string) {
    return this.service.create(dto, id_usuario);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os registros de reprodução com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista de registros retornada com sucesso.' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.service.findAll(paginationDto);
  }

  @Get('propriedade/:id_propriedade')
  @ApiOperation({ summary: 'Lista coberturas por propriedade com paginação' })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  findByPropriedade(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @Query() paginationDto: PaginationDto) {
    return this.service.findByPropriedade(id_propriedade, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cobertura por ID' })
  @ApiParam({ name: 'id', description: 'ID da cobertura' })
  @ApiResponse({ status: 200, description: 'Cobertura encontrada.' })
  @ApiResponse({ status: 404, description: 'Cobertura não encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar cobertura' })
  @ApiParam({ name: 'id', description: 'ID da cobertura' })
  @ApiBody({ type: UpdateCoberturaDto })
  @ApiResponse({ status: 200, description: 'Cobertura atualizada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Cobertura não encontrada.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCoberturaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover cobertura' })
  @ApiParam({ name: 'id', description: 'ID da cobertura' })
  @ApiResponse({ status: 200, description: 'Cobertura removida com sucesso.' })
  @ApiResponse({ status: 404, description: 'Cobertura não encontrada.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
