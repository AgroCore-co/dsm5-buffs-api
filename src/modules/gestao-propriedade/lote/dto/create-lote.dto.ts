import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString, IsNotEmpty, IsOptional, IsInt, IsPositive } from 'class-validator';

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
  @IsPositive()
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
    description: 'Objeto GeoJSON contendo a geometria do polígono.',
    // Este exemplo agora corresponde ao que o Swagger mostrava
    example: {
      type: 'Polygon',
      coordinates: [
        [
          [-47.5, -24.5], [-47.4, -24.5], [-47.4, -24.4], [-47.5, -24.4], [-47.5, -24.5]
        ]
      ]
    },
    required: true, // Ou false, dependendo da sua regra
  })
  @IsObject() // Validação para OBJETO
  @IsNotEmpty()
  geo_mapa: object; // O tipo agora é OBJETO
}

