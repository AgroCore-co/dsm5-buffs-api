import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreatePropriedadeDto {
  @ApiProperty({
    description: 'Nome de identificação da propriedade.',
    example: 'Fazenda Santa Clara',
  })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({
    description: 'CNPJ da propriedade.',
    example: '12.345.678/0001-99',
  })
  @IsString()
  @IsNotEmpty()
  cnpj: string;

  @ApiProperty({
    description: 'ID do endereço da propriedade (UUID). O endereço deve ser criado previamente através do endpoint POST /enderecos.',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID()
  id_endereco: string;

  @ApiProperty({
    description: 'Indica se a propriedade participa do programa ABCB.',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  p_abcb?: boolean;

  @ApiProperty({
    description: 'Tipo de manejo: "P" para pasto, "C" para Concentração.',
    example: 'P',
    required: false,
  })
  @IsString()
  @IsOptional()
  tipo_manejo?: string;
}
