import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/auth.guard';
import { User } from '../../auth/user.decorator';
import { EstoqueLeiteService } from './estoque-leite.service';
import { CreateEstoqueLeiteDto } from './dto/create-estoque-leite.dto';
import { UpdateEstoqueLeiteDto } from './dto/update-estoque-leite.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Produção - Estoque de Leite')
@Controller('estoque-leite')
export class EstoqueLeiteController {
  constructor(private readonly service: EstoqueLeiteService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo registro de estoque de leite' })
  @ApiBody({ type: CreateEstoqueLeiteDto })
  @ApiResponse({ status: 201, description: 'Registro de estoque criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() dto: CreateEstoqueLeiteDto, @User('sub') id_usuario: string) {
    return this.service.create(dto, id_usuario);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os registros de estoque de leite' })
  @ApiResponse({ status: 200, description: 'Lista de registros retornada com sucesso.' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um registro de estoque pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro de estoque' })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um registro de estoque' })
  @ApiParam({ name: 'id', description: 'ID do registro a ser atualizado' })
  @ApiBody({ type: UpdateEstoqueLeiteDto })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEstoqueLeiteDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um registro de estoque' })
  @ApiParam({ name: 'id', description: 'ID do registro a ser removido' })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
