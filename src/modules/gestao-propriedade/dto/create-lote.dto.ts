import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsObject } from 'class-validator';

// Interface para definir a estrutura do objeto GeoJSON que esperamos
interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

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
    description: 'Objeto GeoJSON representando o polígono do lote no mapa. O frontend deve fornecer isso.',
    example: {
      type: 'Polygon',
      coordinates: [
        [
          [-47.5, -24.5],
          [-47.4, -24.5],
          [-47.4, -24.4],
          [-47.5, -24.4],
          [-47.5, -24.5],
        ],
      ],
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  geo_mapa?: GeoJSONPolygon;
}
