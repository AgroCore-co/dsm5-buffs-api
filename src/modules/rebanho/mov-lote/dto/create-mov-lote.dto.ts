import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsDateString, IsPositive, ValidateIf, IsString, MaxLength } from 'class-validator';

export class CreateMovLoteDto {
  @ApiProperty({ example: 1, description: 'ID do grupo de animais que está sendo movido' })
  @IsInt()
  @IsPositive()
  id_grupo: number;

  @ApiProperty({
    example: 1,
    description: 'ID do lote de origem (opcional - será detectado automaticamente se não informado)',
    required: false,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  id_lote_anterior?: number;

  @ApiProperty({ example: 2, description: 'ID do lote de destino (para onde o grupo está se movendo)' })
  @IsInt()
  @IsPositive()
  id_lote_atual: number;

  @ApiProperty({ example: '2025-01-15T08:00:00Z', description: 'Data e hora de entrada do grupo no novo lote' })
  @IsDateString()
  dt_entrada: string;

  @ApiProperty({
    example: 'Mudança para pasto com melhor qualidade de capim',
    description: 'Motivo da movimentação (opcional)',
    required: false,
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  motivo?: string;

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