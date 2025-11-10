import { ApiProperty } from '@nestjs/swagger';

export class DashboardReproducaoDto {
  @ApiProperty({
    description: 'Total de reproduções com status "Em andamento"',
    example: 15,
  })
  totalEmAndamento: number;

  @ApiProperty({
    description: 'Total de reproduções com status "Confirmada"',
    example: 42,
  })
  totalConfirmada: number;

  @ApiProperty({
    description: 'Total de reproduções com status "Falha"',
    example: 8,
  })
  totalFalha: number;

  @ApiProperty({
    description: 'Data da última reprodução registrada (formato YYYY-MM-DD)',
    example: '2025-11-10',
    nullable: true,
  })
  ultimaDataReproducao: string | null;
}
