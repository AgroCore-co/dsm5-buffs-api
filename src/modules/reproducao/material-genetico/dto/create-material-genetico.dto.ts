import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsInt, IsIn } from 'class-validator';

const tiposValidos = ['Sêmen', 'Embrião', 'Óvulo'];
const origensValidas = ['Coleta Própria', 'Compra'];

export class CreateMaterialGeneticoDto {
  @ApiProperty({ example: 'Sêmen', description: 'Tipo do material genético', enum: tiposValidos })
  @IsString()
  @IsNotEmpty()
  @IsIn(tiposValidos)
  tipo: string;

  @ApiProperty({ example: 'Coleta Própria', description: 'Origem do material', enum: origensValidas })
  @IsString()
  @IsNotEmpty()
  @IsIn(origensValidas)
  origem: string;

  @ApiProperty({
    example: 5,
    description: 'ID do búfalo do qual o material foi coletado (se a origem for "Coleta Própria")',
    required: false,
  })
  @IsInt()
  @IsOptional()
  id_bufalo_origem?: number;

  @ApiProperty({
    example: 'Central de Genética XYZ',
    description: 'Nome do fornecedor (se a origem for "Compra")',
    required: false,
  })
  @IsString()
  @IsOptional()
  fornecedor?: string;

  @ApiProperty({ example: '2025-07-20', description: 'Data em que o material foi coletado ou adquirido' })
  @IsDateString()
  @IsNotEmpty()
  data_coleta: Date;
}
