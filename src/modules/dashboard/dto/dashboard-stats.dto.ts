import { ApiProperty } from '@nestjs/swagger';

class BufalosPorRacaDto {
  @ApiProperty({ description: 'Nome da raça', example: 'Murrah' })
  raca: string;

  @ApiProperty({ description: 'Quantidade de búfalos desta raça', example: 45 })
  quantidade: number;
}

export class DashboardStatsDto {
  @ApiProperty({ description: 'Quantidade de machos ativos', example: 25 })
  qtd_macho_ativos: number;

  @ApiProperty({ description: 'Quantidade de fêmeas ativas', example: 75 })
  qtd_femeas_ativas: number;

  @ApiProperty({ description: 'Quantidade total de búfalos registrados', example: 120 })
  qtd_bufalos_registradas: number;

  @ApiProperty({ description: 'Quantidade de búfalos bezerros', example: 30 })
  qtd_bufalos_bezerro: number;

  @ApiProperty({ description: 'Quantidade de búfalos novilhas', example: 20 })
  qtd_bufalos_novilha: number;

  @ApiProperty({ description: 'Quantidade de búfalos vacas', example: 55 })
  qtd_bufalos_vaca: number;

  @ApiProperty({ description: 'Quantidade de búfalos touros', example: 15 })
  qtd_bufalos_touro: number;

  @ApiProperty({ description: 'Quantidade de búfalas lactando', example: 35 })
  qtd_bufalas_lactando: number;

  @ApiProperty({ description: 'Quantidade de lotes/piquetes', example: 8 })
  qtd_lotes: number;

  @ApiProperty({ description: 'Quantidade de usuários', example: 5 })
  qtd_usuarios: number;

  @ApiProperty({
    description: 'Total de búfalos por raça',
    example: [
      { raca: 'Murrah', quantidade: 45 },
      { raca: 'Jafarabadi', quantidade: 38 },
      { raca: 'Mediterrâneo', quantidade: 31 },
      { raca: 'Carabao', quantidade: 14 },
    ],
    type: [BufalosPorRacaDto],
  })
  bufalosPorRaca: BufalosPorRacaDto[];
}
