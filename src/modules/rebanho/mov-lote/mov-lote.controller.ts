import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { MovLoteService } from './mov-lote.service';
import { CreateMovLoteDto } from './dto/create-mov-lote.dto';
import { UpdateMovLoteDto } from './dto/update-mov-lote.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Rebanho - Movimentação de Lotes')
@Controller('mov-lote')
export class MovLoteController {
  constructor(private readonly service: MovLoteService) {}

  @Post()
  @ApiOperation({ summary: 'Registra a movimentação de um grupo entre lotes' })
  @ApiResponse({ status: 201, description: 'Movimentação registrada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos (ex: lotes iguais, ID não existe).' })
  @ApiResponse({ status: 404, description: 'Lote/Grupo não encontrado ou não pertence ao usuário.' })
  create(@Body() dto: CreateMovLoteDto, @User() user: any) {
    return this.service.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as movimentações de lotes do usuário logado' })
  @ApiResponse({ status: 200, description: 'Lista de movimentações retornada com sucesso.' })
  findAll(@User() user: any) {
    return this.service.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma movimentação pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da movimentação' })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Movimentação não encontrada ou não pertence ao usuário.' })
  findOne(@Param('id', ParseIntPipe) id: number, @User() user: any) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma movimentação' })
  @ApiParam({ name: 'id', description: 'ID da movimentação a ser atualizada' })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Movimentação não encontrada ou não pertence ao usuário.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMovLoteDto, @User() user: any) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove o registro de uma movimentação' })
  @ApiParam({ name: 'id', description: 'ID da movimentação a ser removida' })
  @ApiResponse({ status: 204, description: 'Registro removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Movimentação não encontrada ou não pertence ao usuário.' })
  remove(@Param('id', ParseIntPipe) id: number, @User() user: any) {
    return this.service.remove(id, user);
  }
}