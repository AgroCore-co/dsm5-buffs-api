import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsDateString, ValidateIf, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMovLoteDto {
  @ApiProperty({ example: 'b8c4a72d-1234-4567-8901-234567890123', description: 'ID da propriedade (UUID)' })
  @IsUUID('4', { message: 'O id_propriedade deve ser um UUID válido' })
  @IsNotEmpty({ message: 'O id_propriedade é obrigatório' })
  id_propriedade: string;

  @ApiProperty({ example: 'b8c4a72d-1234-4567-8901-234567890123', description: 'ID do grupo de animais que está sendo movido' })
  @IsUUID('4', { message: 'O id_grupo deve ser um UUID válido' })
  id_grupo: string;

  @ApiProperty({
    example: 'b8c4a72d-1234-4567-8901-234567890123',
    description: 'ID do lote de origem (opcional - será detectado automaticamente se não informado)',
    required: false,
  })
  @IsUUID('4', { message: 'O id_lote_anterior deve ser um UUID válido' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  id_lote_anterior?: string;

  @ApiProperty({ example: 'b8c4a72d-1234-4567-8901-234567890123', description: 'ID do lote de destino (para onde o grupo está se movendo)' })
  @IsUUID('4', { message: 'O id_lote_atual deve ser um UUID válido' })
  id_lote_atual: string;

  @ApiProperty({ example: '2025-01-15T08:00:00Z', description: 'Data e hora de entrada do grupo no novo lote' })
  @IsDateString({}, { message: 'A data de entrada deve estar no formato ISO 8601 válido' })
  dt_entrada: string;

  @ApiProperty({
    example: '2025-09-20',
    description: 'Data de saída do grupo do lote atual (opcional)',
    required: false,
  })
  @IsDateString({}, { message: 'A data de saída deve estar no formato ISO 8601 válido' })
  @IsOptional()
  @ValidateIf((o) => o.dt_saida !== null)
  dt_saida?: string;
}
