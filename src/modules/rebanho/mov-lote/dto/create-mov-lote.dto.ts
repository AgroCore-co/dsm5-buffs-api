import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsDateString, ValidateIf, IsString, MaxLength, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMovLoteDto {
  @ApiProperty({ example: 'b8c4a72d-1234-4567-8901-234567890123', description: 'ID do grupo de animais que está sendo movido' })
  @IsUUID()
  id_grupo: string;

  @ApiProperty({
    example: 'b8c4a72d-1234-4567-8901-234567890123',
    description: 'ID do lote de origem (opcional - será detectado automaticamente se não informado)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  id_lote_anterior?: string;

  @ApiProperty({ example: 'b8c4a72d-1234-4567-8901-234567890123', description: 'ID do lote de destino (para onde o grupo está se movendo)' })
  @IsUUID()
  id_lote_atual: string;

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
  @ValidateIf((o) => o.dt_saida !== null)
  dt_saida?: string;
}
