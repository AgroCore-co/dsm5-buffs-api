import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsIn } from 'class-validator';

export class CreateAlimentacaoDefDto {
  @ApiProperty({
    description: 'Nome da alimentação definida.',
    example: 'Ração de Recria',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome_alimentacao: string;

  @ApiProperty({
    description: 'Descrição detalhada da alimentação.',
    example: 'Ração balanceada para búfalos em fase de recria',
    required: false,
  })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({
    description: 'Tipo de alimentação (P-Pasto, C-Concentrado, S-Suplemento).',
    example: 'C',
    required: false,
    maxLength: 1,
    enum: ['P', 'C', 'S'],
  })
  @IsString()
  @IsOptional()
  @MaxLength(1)
  @IsIn(['P', 'C', 'S'])
  tipo_alimentacao?: string;
}
