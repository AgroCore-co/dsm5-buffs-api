import { ApiProperty } from '@nestjs/swagger';

export class ProducaoMensalItemDto {
  @ApiProperty({ description: 'Mês/Ano (formato YYYY-MM)', example: '2025-11' })
  mes: string;

  @ApiProperty({ description: 'Total de leite produzido no mês (litros)', example: 12450.75 })
  total_litros: number;

  @ApiProperty({ description: 'Número de búfalas lactantes no período', example: 35 })
  qtd_bufalas: number;

  @ApiProperty({ description: 'Média diária do mês (litros/dia)', example: 415.02 })
  media_diaria: number;
}

export class DashboardProducaoMensalDto {
  @ApiProperty({ description: 'Ano de referência', example: 2025 })
  ano: number;

  @ApiProperty({ description: 'Total produzido no mês atual (litros)', example: 12450.75 })
  mes_atual_litros: number;

  @ApiProperty({ description: 'Total produzido no mês anterior (litros)', example: 11980.5 })
  mes_anterior_litros: number;

  @ApiProperty({
    description: 'Variação percentual em relação ao mês anterior',
    example: 3.92,
  })
  variacao_percentual: number;

  @ApiProperty({
    description: 'Número de búfalas lactantes no mês atual',
    example: 35,
  })
  bufalas_lactantes_atual: number;

  @ApiProperty({
    description: 'Série histórica mensal (até 12 meses)',
    type: [ProducaoMensalItemDto],
    example: [
      { mes: '2025-01', total_litros: 11200.5, qtd_bufalas: 32, media_diaria: 361.3 },
      { mes: '2025-02', total_litros: 10850.2, qtd_bufalas: 31, media_diaria: 387.5 },
    ],
  })
  serie_historica: ProducaoMensalItemDto[];
}
