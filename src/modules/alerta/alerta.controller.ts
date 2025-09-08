import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe, ParseBoolPipe, HttpCode } from '@nestjs/common';
import { AlertasService } from './alerta.service';
import { CreateAlertaDto } from './dto/create-alerta.dto';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Alertas')
@Controller('alertas')
export class AlertasController {
  constructor(private readonly alertasService: AlertasService) {}

  // Este endpoint seria mais para testes ou criação manual,
  // já que a maioria dos alertas será criada pelos serviços.
  @Post()
  @ApiOperation({ summary: 'Cria um novo alerta manualmente (uso restrito)' })
  create(@Body() createAlertaDto: CreateAlertaDto) {
    return this.alertasService.create(createAlertaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os alertas com base em filtros' })
  @ApiQuery({ name: 'tipo', required: false, description: 'Filtra pelo nicho do alerta (CLINICO, SANITARIO, etc.)' })
  @ApiQuery({ name: 'antecedencia', required: false, description: 'Filtra por alertas que ocorrerão nos próximos X dias' })
  @ApiQuery({ name: 'incluirVistos', required: false, description: 'Se true, inclui alertas já marcados como vistos', type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de alertas retornada com sucesso.' })
  findAll(
    @Query('tipo') tipo?: string,
    @Query('antecedencia') antecendencia?: number,
    @Query('incluirVistos', new ParseBoolPipe({ optional: true })) incluirVistos?: boolean,
  ) {
    return this.alertasService.findAll(tipo, antecendencia, incluirVistos);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um alerta específico pelo ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.alertasService.findOne(id);
  }
  
  @Patch(':id/visto')
  @ApiOperation({ summary: 'Marca um alerta como visto ou não visto' })
  @ApiQuery({ name: 'status', type: Boolean, description: 'Defina como "true" para visto ou "false" para não visto' })
  @ApiResponse({ status: 200, description: 'Status do alerta atualizado.'})
  @ApiResponse({ status: 404, description: 'Alerta não encontrado.'})
  setVisto(
    @Param('id', ParseIntPipe) id: number,
    @Query('status', ParseBoolPipe) status: boolean
  ) {
    return this.alertasService.setVisto(id, status);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Deleta um alerta' })
  @ApiResponse({ status: 204, description: 'Alerta deletado com sucesso.'})
  @ApiResponse({ status: 404, description: 'Alerta não encontrado.'})
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.alertasService.remove(id);
  }
}

