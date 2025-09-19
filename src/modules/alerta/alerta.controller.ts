import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe, ParseBoolPipe, HttpCode, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { AlertasService } from './alerta.service';
import { CreateAlertaDto, PrioridadeAlerta, NichoAlerta } from './dto/create-alerta.dto';
import { SupabaseAuthGuard } from '../auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Alertas')
@Controller('alertas')
export class AlertasController {
  constructor(private readonly alertasService: AlertasService) {}

  // Este endpoint seria mais para testes ou criação manual,
  // já que a maioria dos alertas será criada pelos serviços.
  @Post()
  @ApiOperation({ 
    summary: 'Cria um novo alerta com classificação automática de prioridade',
    description: `
      Cria um alerta que pode ser classificado automaticamente usando IA (Gemini).
      
      **Funcionalidades:**
      - 🤖 **Classificação automática de prioridade**: Se fornecido texto de ocorrência clínica, a IA analisará e definirá a prioridade (BAIXA, MEDIA, ALTA)
      - 📋 **Criação manual**: Também permite criação manual com prioridade pré-definida
      
      **Classificação IA - Critérios:**
      - **ALTA**: Risco de vida, alto contágio, sintomas graves (ex: animal caído, febre alta, mastite gangrenosa)
      - **MÉDIA**: Requer atenção rápida, pode evoluir (ex: úbere inchado, diarreia persistente, manqueira)
      - **BAIXA**: Problemas localizados, observações de rotina (ex: pequenos arranhões, poucos parasitas)
    `
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Alerta criado com sucesso. Prioridade pode ter sido classificada automaticamente pela IA.' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dados inválidos fornecidos.' 
  })
  create(@Body() createAlertaDto: CreateAlertaDto) {
    return this.alertasService.create(createAlertaDto);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30)
  @ApiOperation({ 
    summary: 'Lista alertas com filtros avançados',
    description: `
      Retorna lista de alertas com opções de filtro para facilitar o monitoramento do rebanho.
      
      **Tipos de Alerta disponíveis:**
      - CLINICO: Problemas de saúde individual
      - SANITARIO: Questões sanitárias do rebanho
      - REPRODUCAO: Alertas reprodutivos
      - MANEJO: Alertas de manejo geral
    `
  })
  @ApiQuery({ 
    name: 'tipo', 
    required: false, 
    description: 'Filtra pelo tipo do alerta (CLINICO, SANITARIO, REPRODUCAO, MANEJO)',
    enum: NichoAlerta
  })
  @ApiQuery({ 
    name: 'prioridade', 
    required: false, 
    description: 'Filtra pela prioridade do alerta (classificada pela IA ou manual)',
    enum: PrioridadeAlerta
  })
  @ApiQuery({ 
    name: 'antecedencia', 
    required: false, 
    description: 'Filtra alertas que ocorrerão nos próximos X dias',
    type: Number,
    example: 7
  })
  @ApiQuery({ 
    name: 'incluirVistos', 
    required: false, 
    description: 'Se true, inclui alertas já visualizados pelo usuário', 
    type: Boolean,
    example: false
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de alertas retornada. Prioridades podem ter sido classificadas pela IA Gemini.' 
  })
  findAll(
    @Query('tipo') tipo?: string,
    @Query('prioridade') prioridade?: PrioridadeAlerta,
    @Query('antecedencia') antecendencia?: number,
    @Query('incluirVistos', new ParseBoolPipe({ optional: true })) incluirVistos?: boolean,
  ) {
    return this.alertasService.findAll(tipo, antecendencia, incluirVistos);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30) 
  @ApiOperation({ 
    summary: 'Busca alerta específico com detalhes completos',
    description: 'Retorna informações detalhadas de um alerta, incluindo se a prioridade foi classificada por IA.'
  })
  @ApiParam({ name: 'id', description: 'ID único do alerta', type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Alerta encontrado com todos os detalhes.' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Alerta não encontrado.' 
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.alertasService.findOne(id);
  }
  
  @Patch(':id/visto')
  @ApiOperation({ 
    summary: 'Gerencia status de visualização do alerta',
    description: `
      Marca um alerta como visto ou não visto para controle do usuário.
      
      **Funcionalidade:**
      - Permite rastreamento de quais alertas já foram verificados
      - Útil para filtrar apenas alertas pendentes de atenção
      - Não afeta a prioridade ou outros dados do alerta
    `
  })
  @ApiParam({ name: 'id', description: 'ID único do alerta', type: Number })
  @ApiQuery({ 
    name: 'status', 
    type: Boolean, 
    description: 'true = marcar como visto, false = marcar como não visto',
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Status de visualização atualizado com sucesso.'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Alerta não encontrado.'
  })
  setVisto(
    @Param('id', ParseIntPipe) id: number,
    @Query('status', ParseBoolPipe) status: boolean
  ) {
    return this.alertasService.setVisto(id, status);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ 
    summary: 'Remove alerta do sistema',
    description: 'Deleta permanentemente um alerta. Esta ação não pode ser desfeita.'
  })
  @ApiParam({ name: 'id', description: 'ID único do alerta a ser deletado', type: Number })
  @ApiResponse({ 
    status: 204, 
    description: 'Alerta deletado com sucesso.'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Alerta não encontrado.'
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.alertasService.remove(id);
  }
}

