import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, HttpCode, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(MovLoteController.name);
  
  constructor(private readonly service: MovLoteService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Registra movimentação física de um grupo para novo lote',
    description: 'Move um grupo inteiro de animais de um lote/pasto para outro, registrando o histórico de movimentação física.'
  })
  @ApiResponse({ status: 201, description: 'Movimentação registrada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos.' })
  async create(@Body() createDto: CreateMovLoteDto, @User() user: any) {
    const startTime = Date.now();
    const userInfo = user?.sub || user?.id || 'unknown';
    
    this.logger.log(`[REQUEST] Movimentacao fisica solicitada - Usuario: ${userInfo}, Payload: ${JSON.stringify(createDto)}`);
    
    try {
      const result = await this.service.create(createDto, user);
      const duration = Date.now() - startTime;
      
      this.logger.log(`[RESPONSE_SUCCESS] Movimentacao fisica registrada - Usuario: ${userInfo}, Movimento ID: ${result.movimentacao.id}, Duracao: ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`[RESPONSE_ERROR] Falha na movimentacao fisica - Usuario: ${userInfo}, Erro: ${error.message}, Duracao: ${duration}ms`);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as movimentações de lotes' })
  @ApiResponse({ status: 200, description: 'Lista de movimentações retornada com sucesso.' })
  findAll() {
    return this.service.findAll();
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

  @Get('historico/grupo/:id_grupo')
  @ApiOperation({ 
    summary: 'Busca o histórico completo de movimentações de um grupo',
    description: 'Retorna todas as movimentações físicas de um grupo específico, ordenadas pela data mais recente.'
  })
  @ApiParam({ name: 'id_grupo', description: 'ID do grupo para consultar o histórico' })
  @ApiResponse({ status: 200, description: 'Histórico de movimentações do grupo.' })
  async findHistoricoGrupo(@Param('id_grupo', ParseIntPipe) id_grupo: number) {
    return this.service.findHistoricoByGrupo(id_grupo);
  }

  @Get('status/grupo/:id_grupo')
  @ApiOperation({ 
    summary: 'Verifica o status atual de localização de um grupo',
    description: 'Retorna onde o grupo está localizado atualmente (lote atual) e desde quando.'
  })
  @ApiParam({ name: 'id_grupo', description: 'ID do grupo para verificar status atual' })
  @ApiResponse({ status: 200, description: 'Status atual do grupo.' })
  async findStatusAtual(@Param('id_grupo', ParseIntPipe) id_grupo: number) {
    return this.service.findStatusAtual(id_grupo);
  }
}