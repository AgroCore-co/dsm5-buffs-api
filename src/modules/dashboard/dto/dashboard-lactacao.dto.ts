import { ApiProperty } from '@nestjs/swagger';

export class CicloLactacaoMetricaDto {
  @ApiProperty({ description: 'ID do ciclo de lactação', example: 'uuid-123' })
  id_ciclo_lactacao: string;

  @ApiProperty({ description: 'ID da búfala', example: 'uuid-456' })
  id_bufala: string;

  @ApiProperty({ description: 'Nome da búfala', example: 'Stella' })
  nome_bufala: string;

  @ApiProperty({ description: 'Número do parto', example: 3 })
  numero_parto: number;

  @ApiProperty({ description: 'Data do parto', example: '2024-01-15' })
  dt_parto: string;

  @ApiProperty({ description: 'Data de secagem real', example: '2024-09-20' })
  dt_secagem_real: string;

  @ApiProperty({ description: 'Dias em lactação', example: 249 })
  dias_em_lactacao: number;

  @ApiProperty({ description: 'Média diária de lactação (litros)', example: 15.5 })
  media_lactacao: number;

  @ApiProperty({ description: 'Total de lactação (litros)', example: 3859.5 })
  lactacao_total: number;

  @ApiProperty({
    description: 'Classificação do ciclo',
    example: 'Ótima',
    enum: ['Ótima', 'Boa', 'Mediana', 'Ruim'],
  })
  classificacao: string;
}

export class DashboardLactacaoDto {
  @ApiProperty({
    description: 'Ano das métricas de lactação',
    example: 2024,
  })
  ano: number;

  @ApiProperty({
    description: 'Média do rebanho para o ano (litros)',
    example: 3200.5,
  })
  media_rebanho_ano: number;

  @ApiProperty({
    description: 'Ciclos de lactação ordenados de melhor para pior classificação',
    type: [CicloLactacaoMetricaDto],
  })
  ciclos: CicloLactacaoMetricaDto[];
}
