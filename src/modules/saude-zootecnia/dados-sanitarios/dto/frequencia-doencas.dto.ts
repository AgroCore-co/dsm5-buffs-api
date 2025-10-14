import { ApiProperty } from '@nestjs/swagger';

export class FrequenciaDoencaDto {
  @ApiProperty({
    description: 'Nome da doença (normalizado em lowercase)',
    example: 'mastite',
  })
  doenca: string;

  @ApiProperty({
    description: 'Número de ocorrências registradas',
    example: 5,
  })
  frequencia: number;
}

export class FrequenciaDoencasResponseDto {
  @ApiProperty({
    description: 'Lista de doenças e suas frequências',
    type: [FrequenciaDoencaDto],
  })
  dados: FrequenciaDoencaDto[];

  @ApiProperty({
    description: 'Total de registros analisados',
    example: 150,
  })
  total_registros: number;

  @ApiProperty({
    description: 'Número de doenças distintas encontradas',
    example: 12,
  })
  total_doencas_distintas: number;
}
