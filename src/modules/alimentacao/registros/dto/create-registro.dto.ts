import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRegistroAlimentacaoDto {
  @ApiProperty()
  @IsInt()
  id_grupo: number;

  @ApiProperty()
  @IsInt()
  id_aliment_def: number;

  @ApiProperty()
  @IsInt()
  id_usuario: number;

  @ApiProperty()
  @IsNumber()
  quantidade: number;

  @ApiProperty()
  @IsString()
  unidade_medida: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  freq_dia?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  dt_registro?: string; // ISO date string
}


