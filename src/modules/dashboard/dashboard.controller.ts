import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/auth.guard';
import { DashboardService } from './dashboard.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { DashboardLactacaoDto } from './dto/dashboard-lactacao.dto';
import { DashboardProducaoMensalDto } from './dto/dashboard-producao-mensal.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(':id_propriedade')
  @ApiOperation({
    summary: 'Obter estatísticas do dashboard para uma propriedade',
    description: 'Retorna estatísticas completas de uma propriedade específica incluindo contagens de animais, lotes e usuários',
  })
  @ApiParam({
    name: 'id_propriedade',
    description: 'ID da propriedade (UUID)',
    type: 'string',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso.',
    type: DashboardStatsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Propriedade não encontrada.',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor.',
  })
  async getStats(@Param('id_propriedade', ParseUUIDPipe) id_propriedade: string): Promise<DashboardStatsDto> {
    return this.dashboardService.getStats(id_propriedade);
  }

  @Get('lactacao/:id_propriedade')
  @ApiOperation({
    summary: 'Obter métricas de lactação por ciclo de uma propriedade',
    description: 'Retorna ciclos de lactação de todas as bufalas fêmeas com classificação (Ótima, Boa, Mediana, Ruim)',
  })
  @ApiParam({
    name: 'id_propriedade',
    description: 'ID da propriedade (UUID)',
    type: 'string',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas de lactação retornadas com sucesso.',
    type: DashboardLactacaoDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Propriedade não encontrada.',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor.',
  })
  async getLactacaoMetricas(
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @Query('ano') ano: number,
  ): Promise<DashboardLactacaoDto> {
    return this.dashboardService.getLactacaoMetricas(id_propriedade, Number(ano));
  }

  @Get('producao-mensal/:id_propriedade')
  @ApiOperation({
    summary: 'Obter métricas de produção mensal de leite',
    description: 'Retorna produção total mensal, comparativo com mês anterior e série histórica anual',
  })
  @ApiParam({
    name: 'id_propriedade',
    description: 'ID da propriedade (UUID)',
    type: 'string',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiQuery({
    name: 'ano',
    description: 'Ano de referência (padrão: ano atual)',
    required: false,
    type: Number,
    example: 2025,
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas de produção mensal retornadas com sucesso.',
    type: DashboardProducaoMensalDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Propriedade não encontrada.',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor.',
  })
  async getProducaoMensal(
    @Param('id_propriedade', ParseUUIDPipe) id_propriedade: string,
    @Query('ano') ano?: number,
  ): Promise<DashboardProducaoMensalDto> {
    return this.dashboardService.getProducaoMensal(id_propriedade, ano ? Number(ano) : undefined);
  }
}
