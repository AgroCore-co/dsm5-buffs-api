import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRegistroAlimentacaoDto {
  @ApiProperty()
  @IsUUID()
  id_grupo: string;

  @ApiProperty()
  @IsUUID()
  id_aliment_def: string;

  @ApiProperty()
  @IsUUID()
  id_usuario: string;

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
