import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseBoolPipe,
  HttpCode,
  UseInterceptors,
  HttpStatus,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { AlertasService } from './alerta.service';
import { CreateAlertaDto, PrioridadeAlerta, NichoAlerta } from './dto/create-alerta.dto';
import { SupabaseAuthGuard } from '../auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { PaginationDto } from '../../core/dto/pagination.dto';
import { AlertasScheduler } from './alerta.scheduler';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Alertas')
@Controller('alertas')
export class AlertasController {
  constructor(
    private readonly alertasService: AlertasService,
    private readonly alertasScheduler: AlertasScheduler,
  ) {}

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
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Alerta criado com sucesso. Prioridade pode ter sido classificada automaticamente pela IA.',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos fornecidos.',
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
    `,
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    description: 'Filtra pelo tipo do alerta (CLINICO, SANITARIO, REPRODUCAO, MANEJO)',
    enum: NichoAlerta,
  })
  @ApiQuery({
    name: 'prioridade',
    required: false,
    description: 'Filtra pela prioridade do alerta (classificada pela IA ou manual)',
    enum: PrioridadeAlerta,
  })
  @ApiQuery({
    name: 'antecedencia',
    required: false,
    description: 'Filtra alertas que ocorrerão nos próximos X dias',
    type: Number,
    example: 7,
  })
  @ApiQuery({
    name: 'incluirVistos',
    required: false,
    description: 'Se true, inclui alertas já visualizados pelo usuário',
    type: Boolean,
    example: false,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de alertas retornada com paginação. Prioridades podem ter sido classificadas pela IA Gemini.',
  })
  findAll(
    @Query('tipo') tipo?: string,
    @Query('prioridade') prioridade?: PrioridadeAlerta,
    @Query('antecedencia') antecendencia?: number,
    @Query('incluirVistos', new ParseBoolPipe({ optional: true })) incluirVistos?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const paginationDto: PaginationDto = { page, limit };
    return this.alertasService.findAll(tipo, antecendencia, incluirVistos, paginationDto);
  }

  @Get('propriedade/:id_propriedade')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30)
  @ApiOperation({
    summary: 'Lista alertas por propriedade com filtros opcionais',
    description: `
      Retorna alertas de uma propriedade específica com suporte a filtros avançados.
      
      **Filtros disponíveis:**
      - **nichos**: Filtra por um ou mais nichos específicos (CLINICO, SANITARIO, REPRODUCAO, MANEJO, PRODUCAO)
      - **incluirVistos**: Inclui ou exclui alertas já visualizados
      - **prioridade**: Filtra por nível de prioridade (BAIXA, MEDIA, ALTA)
      - **paginação**: Controle de página e limite de resultados
      
      **Diferença do endpoint de verificação:**
      - Este endpoint apenas LISTA alertas existentes (sem reprocessamento)
      - Use POST /alertas/verificar para criar novos alertas baseados em dados atuais
    `,
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiQuery({
    name: 'incluirVistos',
    required: false,
    description: 'Se true, inclui alertas já visualizados',
    type: Boolean,
    example: false,
  })
  @ApiQuery({
    name: 'nichos',
    required: false,
    description: 'Filtra por nichos específicos. Pode enviar múltiplos valores.',
    enum: NichoAlerta,
    isArray: true,
    example: ['REPRODUCAO', 'SANITARIO'],
  })
  @ApiQuery({
    name: 'prioridade',
    required: false,
    description: 'Filtra por prioridade específica',
    enum: PrioridadeAlerta,
    example: 'ALTA',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de alertas da propriedade retornada com sucesso.',
  })
  findByPropriedade(
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @Query('incluirVistos', new ParseBoolPipe({ optional: true })) incluirVistos?: boolean,
    @Query('nichos') nichos?: string | string[],
    @Query('prioridade') prioridade?: PrioridadeAlerta,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const paginationDto: PaginationDto = { page, limit };

    // Normaliza nichos para array
    const nichosArray: NichoAlerta[] | undefined = nichos ? (Array.isArray(nichos) ? (nichos as NichoAlerta[]) : [nichos as NichoAlerta]) : undefined;

    return this.alertasService.findByPropriedade(id_propriedade, incluirVistos, paginationDto, nichosArray, prioridade);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30)
  @ApiOperation({
    summary: 'Busca alerta específico com detalhes completos',
    description: 'Retorna informações detalhadas de um alerta, incluindo se a prioridade foi classificada por IA.',
  })
  @ApiParam({ name: 'id', description: 'ID único do alerta', type: String })
  @ApiResponse({
    status: 200,
    description: 'Alerta encontrado com todos os detalhes.',
  })
  @ApiResponse({
    status: 404,
    description: 'Alerta não encontrado.',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
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
    `,
  })
  @ApiParam({ name: 'id', description: 'ID único do alerta', type: String })
  @ApiQuery({
    name: 'status',
    type: Boolean,
    description: 'true = marcar como visto, false = marcar como não visto',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Status de visualização atualizado com sucesso.',
  })
  @ApiResponse({
    status: 404,
    description: 'Alerta não encontrado.',
  })
  setVisto(@Param('id', ParseUUIDPipe) id: string, @Query('status', ParseBoolPipe) status: boolean) {
    return this.alertasService.setVisto(id, status);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Remove alerta do sistema',
    description: 'Deleta permanentemente um alerta. Esta ação não pode ser desfeita.',
  })
  @ApiParam({ name: 'id', description: 'ID único do alerta a ser deletado', type: String })
  @ApiResponse({
    status: 204,
    description: 'Alerta deletado com sucesso.',
  })
  @ApiResponse({
    status: 404,
    description: 'Alerta não encontrado.',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.alertasService.remove(id);
  }

  @Post('verificar/:id_propriedade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verifica e cria alertas pendentes para uma propriedade específica',
    description: `
      Executa verificação manual de alertas para uma propriedade, processando dados históricos e atuais.
      
      **Funcionalidade:**
      - 🔍 **Verificação sob demanda**: Processa dados da propriedade sem esperar os schedulers diários
      - 🎯 **Filtro por nicho**: Permite verificar apenas nichos específicos (CLINICO, SANITARIO, REPRODUCAO, MANEJO)
      - 📊 **Processamento de dados históricos**: Ideal para processar dados anteriores à implementação do sistema de alertas
      - ⚡ **Performance otimizada**: Processa apenas uma propriedade por vez para evitar sobrecarga
      
      **Nichos Disponíveis:**
      - **CLINICO**: Doenças graves que necessitam atenção imediata
      - **SANITARIO**: Tratamentos com retorno próximo (15 dias) e vacinações programadas (7 dias)
      - **REPRODUCAO**: Nascimentos previstos (30 dias), coberturas sem diagnóstico (90+ dias), fêmeas vazias (180+ dias)
      - **MANEJO**: Secagem de búfalas (alertas criados automaticamente no registro de parto)
      
      **Exemplo de uso:**
      - Verificar todos os nichos: não enviar parâmetro nichos
      - Verificar apenas reprodução: ?nichos=REPRODUCAO
      - Verificar sanitário e reprodução: ?nichos=SANITARIO&nichos=REPRODUCAO
    `,
  })
  @ApiParam({
    name: 'id_propriedade',
    description: 'ID da propriedade para verificação de alertas',
    type: 'string',
  })
  @ApiQuery({
    name: 'nichos',
    required: false,
    description: 'Nichos específicos para verificar. Se omitido, verifica todos os nichos.',
    enum: NichoAlerta,
    isArray: true,
    example: ['REPRODUCAO', 'SANITARIO'],
  })
  @ApiResponse({
    status: 200,
    description: 'Verificação concluída com sucesso. Retorna detalhes dos alertas criados por nicho.',
    schema: {
      example: {
        success: true,
        message: 'Verificação de alertas concluída',
        propriedade: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        nichos_verificados: ['SANITARIO', 'REPRODUCAO'],
        alertas_criados: 5,
        detalhes: {
          SANITARIO: {
            tratamentos: 2,
            vacinacoes: 1,
          },
          REPRODUCAO: {
            nascimentos: 1,
            coberturas_sem_diagnostico: 0,
            femeas_vazias: 1,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros inválidos fornecidos.',
  })
  @ApiResponse({
    status: 404,
    description: 'Propriedade não encontrada.',
  })
  async verificarAlertas(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string, @Query('nichos') nichos?: string | string[]) {
    // Normaliza nichos para array
    const nichosArray: NichoAlerta[] = nichos
      ? Array.isArray(nichos)
        ? (nichos as NichoAlerta[])
        : [nichos as NichoAlerta]
      : [NichoAlerta.CLINICO, NichoAlerta.SANITARIO, NichoAlerta.REPRODUCAO, NichoAlerta.MANEJO];

    const detalhes: any = {};
    let totalAlertas = 0;

    // Verifica cada nicho solicitado
    for (const nicho of nichosArray) {
      switch (nicho) {
        case NichoAlerta.SANITARIO:
          const tratamentos = await this.alertasScheduler.verificarTratamentosPropriedade(id_propriedade);
          const vacinacoes = await this.alertasScheduler.verificarVacinacoesPropriedade(id_propriedade);
          detalhes[nicho] = { tratamentos, vacinacoes };
          totalAlertas += tratamentos + vacinacoes;
          break;

        case NichoAlerta.REPRODUCAO:
          const nascimentos = await this.alertasScheduler.verificarNascimentosPropriedade(id_propriedade);
          const coberturasSemDiag = await this.alertasScheduler.verificarCoberturaSemDiagnosticoPropriedade(id_propriedade);
          const femeasVazias = await this.alertasScheduler.verificarFemeasVaziasPropriedade(id_propriedade);
          detalhes[nicho] = {
            nascimentos,
            coberturas_sem_diagnostico: coberturasSemDiag,
            femeas_vazias: femeasVazias,
          };
          totalAlertas += nascimentos + coberturasSemDiag + femeasVazias;
          break;

        case NichoAlerta.CLINICO:
          detalhes[nicho] = {
            message: 'Alertas clínicos são criados automaticamente ao registrar doenças graves',
          };
          break;

        case NichoAlerta.MANEJO:
          detalhes[nicho] = {
            message: 'Alertas de manejo (secagem) são criados automaticamente ao registrar partos',
          };
          break;
      }
    }

    return {
      success: true,
      message: 'Verificação de alertas concluída',
      propriedade: id_propriedade,
      nichos_verificados: nichosArray,
      alertas_criados: totalAlertas,
      detalhes,
    };
  }
}
