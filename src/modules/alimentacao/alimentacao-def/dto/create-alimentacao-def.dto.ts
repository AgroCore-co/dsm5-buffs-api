import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class CreateAlimentacaoDefDto {
  @ApiProperty({
    description: 'ID da propriedade à qual esta definição de alimentação pertence (UUID).',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID()
  @IsNotEmpty()
  id_propriedade: string;

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
