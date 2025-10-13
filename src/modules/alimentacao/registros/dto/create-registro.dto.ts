import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateRegistroAlimentacaoDto {
  @ApiProperty({
    description: 'ID da propriedade à qual este registro pertence',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID()
  @IsNotEmpty()
  id_propriedade: string;

  @ApiProperty({
    description: 'ID do grupo de búfalos que receberá a alimentação',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID()
  @IsNotEmpty()
  id_grupo: string;

  @ApiProperty({
    description: 'ID da definição de alimentação',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID()
  @IsNotEmpty()
  id_aliment_def: string;

  @ApiProperty({
    description: 'ID do usuário que está registrando',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID()
  @IsNotEmpty()
  id_usuario: string;

  @ApiProperty({
    description: 'Quantidade de alimento fornecida',
    example: 50.5,
  })
  @IsNumber()
  @IsNotEmpty()
  quantidade: number;

  @ApiProperty({
    description: 'Unidade de medida (kg, g, litros, etc)',
    example: 'kg',
  })
  @IsString()
  @IsNotEmpty()
  unidade_medida: string;

  @ApiProperty({
    description: 'Frequência por dia (quantas vezes ao dia)',
    example: 2,
    required: false,
  })
  @IsInt()
  @IsOptional()
  freq_dia?: number;

  @ApiProperty({
    description: 'Data e hora do registro',
    example: '2025-10-13T10:00:00Z',
    required: false,
  })
  @IsString()
  @IsOptional()
  dt_registro?: string; // ISO date string
}
