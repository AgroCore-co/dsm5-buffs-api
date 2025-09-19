import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator'; // <-- Importe o decorator
import { DadosZootecnicosService } from './dados-zootecnicos.service';
import { CreateDadoZootecnicoDto } from './dto/create-dado-zootecnico.dto';
import { UpdateDadoZootecnicoDto } from './dto/update-dado-zootecnico.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Saúde/Zootecnia - Dados Zootécnicos')
@Controller('dados-zootecnicos')
export class DadosZootecnicosController {
  constructor(private readonly service: DadosZootecnicosService) {}

  // --- ROTAS ANINHADAS SOB UM BÚFALO ---

  @Post('/bufalo/:id_bufalo')
  @ApiOperation({
    summary: 'Cria um registro zootécnico para um búfalo específico',
    description: 'Adiciona um novo registro de métrica (peso, altura, etc.) para um búfalo, associado ao usuário logado.',
  })
  @ApiParam({ name: 'id_bufalo', description: 'ID do búfalo ao qual o registro pertence', type: Number })
  @ApiResponse({ status: 201, description: 'Registro criado com sucesso.' })
  create(
    @Param('id_bufalo', ParseIntPipe) id_bufalo: number,
    @User() user: any, // <-- CORRIGIDO: Recebe o objeto 'user' completo
    @Body() dto: CreateDadoZootecnicoDto,
  ) {
    // CORRIGIDO: Extraímos o 'sub' (ID do usuário) do objeto de usuário injetado
    const id_usuario_logado = user.sub;

    // Passamos o ID (UUID) correto para o serviço
    return this.service.create(dto, id_bufalo, id_usuario_logado);
  }

  @Get('/bufalo/:id_bufalo')
  @ApiOperation({
    summary: 'Lista todos os registros zootécnicos de um búfalo',
    description: 'Retorna o histórico completo de dados zootécnicos para um búfalo específico.',
  })
  @ApiParam({ name: 'id_bufalo', description: 'ID do búfalo para consultar os registros', type: Number })
  @ApiResponse({ status: 200, description: 'Lista de registros retornada com sucesso.' })
  findAllByBufalo(@Param('id_bufalo', ParseIntPipe) id_bufalo: number) {
    return this.service.findAllByBufalo(id_bufalo);
  }

  // --- ROTAS DIRETAS PARA UM REGISTRO ESPECÍFICO ---

  @Get(':id_zootec')
  @ApiOperation({
    summary: 'Busca um registro zootécnico único pelo seu ID',
    description: 'Retorna um registro zootécnico específico.',
  })
  @ApiParam({ name: 'id_zootec', description: 'ID do registro zootécnico', type: Number })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id_zootec', ParseIntPipe) id_zootec: number) {
    return this.service.findOne(id_zootec);
  }

  @Patch(':id_zootec')
  @ApiOperation({ summary: 'Atualiza um registro zootécnico' })
  @ApiParam({ name: 'id_zootec', description: 'ID do registro zootécnico a ser atualizado', type: Number })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(@Param('id_zootec', ParseIntPipe) id_zootec: number, @Body() dto: UpdateDadoZootecnicoDto) {
    return this.service.update(id_zootec, dto);
  }

  @Delete(':id_zootec')
  @ApiOperation({ summary: 'Remove um registro zootécnico' })
  @ApiParam({ name: 'id_zootec', description: 'ID do registro zootécnico a ser removido', type: Number })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id_zootec', ParseIntPipe) id_zootec: number) {
    return this.service.remove(id_zootec);
  }
}