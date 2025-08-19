import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsDateString, IsPositive, ValidateIf } from 'class-validator';

export class CreateMovLoteDto {
  @ApiProperty({ example: 1, description: 'ID do grupo de animais que está sendo movido' })
  @IsInt()
  @IsPositive()
  id_grupo: number;

  @ApiProperty({
    example: 1,
    description: 'ID do lote de origem (de onde o grupo está saindo)',
    required: false,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  id_lote_anterior?: number;

  @ApiProperty({ example: 2, description: 'ID do lote de destino (para onde o grupo está entrando)' })
  @IsInt()
  @IsPositive()
  id_lote_atual: number;

  @ApiProperty({ example: '2025-08-18', description: 'Data de entrada do grupo no lote atual' })
  @IsDateString()
  dt_entrada: string;

  @ApiProperty({
    example: '2025-09-20',
    description: 'Data de saída do grupo do lote atual (opcional)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  @ValidateIf(o => o.dt_saida !== null)
  dt_saida?: string;
}