import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateLoteDto {
  @ApiProperty({
    description: 'Nome de identificação do lote/piquete.',
    example: 'Pasto da Sede',
  })
  @IsString()
  @IsNotEmpty()
  nome_lote: string;

  @ApiProperty({
    description: 'ID da propriedade à qual este lote pertence.',
    example: 1,
  })
  @IsInt()
  id_propriedade: number;

  @ApiProperty({
    description: 'Descrição opcional sobre o lote.',
    example: 'Lote principal para recria.',
    required: false,
  })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({
    description: 'Polígono no formato WKT aceito pelo PostgreSQL (ex.: POLYGON((x y, ...))).',
    example: 'POLYGON((-47.5 -24.5, -47.4 -24.5, -47.4 -24.4, -47.5 -24.4, -47.5 -24.5))',
    required: false,
  })
  @IsString()
  @IsOptional()
  geo_mapa?: string;
}
