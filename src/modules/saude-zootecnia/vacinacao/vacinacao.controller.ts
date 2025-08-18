import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/auth.guard';
import { User } from '../../auth/user.decorator';
import { VacinacaoService } from './vacinacao.service';
import { CreateVacinacaoDto } from './dto/create-vacinacao.dto';
import { UpdateVacinacaoDto } from './dto/update-vacinacao.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Saúde/Zootecnia - Vacinação')
@Controller('vacinacao')
export class VacinacaoController {
  constructor(private readonly service: VacinacaoService) {}

  @Post('/bufalo/:id_bufalo')
  @ApiOperation({ summary: 'Cria um registro de vacinação para um búfalo' })
  @ApiParam({ name: 'id_bufalo', description: 'ID do búfalo que recebeu a vacina' })
  @ApiResponse({ status: 201, description: 'Registro de vacinação criado com sucesso.' })
  create(@Param('id_bufalo', ParseIntPipe) id_bufalo: number, @User('sub') id_usuario: string, @Body() dto: CreateVacinacaoDto) {
    return this.service.create(dto, id_bufalo, id_usuario);
  }

  @Get('/bufalo/:id_bufalo')
  @ApiOperation({ summary: 'Lista todos os registros de vacinação de um búfalo' })
  @ApiParam({ name: 'id_bufalo', description: 'ID do búfalo para consultar o histórico' })
  @ApiResponse({ status: 200, description: 'Histórico de vacinação retornado com sucesso.' })
  findAllByBufalo(@Param('id_bufalo', ParseIntPipe) id_bufalo: number) {
    return this.service.findAllByBufalo(id_bufalo);
  }

  @Get(':id_vacinacao')
  @ApiOperation({ summary: 'Busca um registro de vacinação pelo ID' })
  @ApiParam({ name: 'id_vacinacao', description: 'ID do registro de vacinação' })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id_vacinacao', ParseIntPipe) id_vacinacao: number) {
    return this.service.findOne(id_vacinacao);
  }

  @Patch(':id_vacinacao')
  @ApiOperation({ summary: 'Atualiza um registro de vacinação' })
  @ApiParam({ name: 'id_vacinacao', description: 'ID do registro a ser atualizado' })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso.' })
  update(@Param('id_vacinacao', ParseIntPipe) id_vacinacao: number, @Body() dto: UpdateVacinacaoDto) {
    return this.service.update(id_vacinacao, dto);
  }

  @Delete(':id_vacinacao')
  @ApiOperation({ summary: 'Remove um registro de vacinação' })
  @ApiParam({ name: 'id_vacinacao', description: 'ID do registro a ser removido' })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso.' })
  remove(@Param('id_vacinacao', ParseIntPipe) id_vacinacao: number) {
    return this.service.remove(id_vacinacao);
  }
}
