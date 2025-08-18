import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateAlimentacaoDefDto {
  @ApiProperty({
    description: 'Descrição da alimentação.',
    example: 'Ração balanceada para búfalos em fase de recria.',
    required: false,
  })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({
    description: 'Tipo de alimentação (texto livre).',
    example: 'Concentrado',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  tipo_alimentacao: string;
}
