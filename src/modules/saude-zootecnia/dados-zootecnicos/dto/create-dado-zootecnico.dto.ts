import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDadoZootecnicoDto {
  @ApiProperty({ description: 'Peso do animal em kg', example: 320.5 })
  @IsNumber()
  @IsNotEmpty()
  peso: number;

  @ApiProperty({ description: 'Condição corporal (escala numérica)', example: 3.25 })
  @IsString()
  @IsNotEmpty()
  condicao_corporal: string;

  @ApiProperty({ description: 'Cor da pelagem', required: false, example: 'Preta' })
  @IsString()
  @IsOptional()
  cor_pelagem?: string;

  @ApiProperty({ description: 'Formato do chifre', required: false, example: 'Curvado' })
  @IsString()
  @IsOptional()
  formato_chifre?: string;

  @ApiProperty({ description: 'Porte corporal', required: false, example: 'Médio' })
  @IsString()
  @IsOptional()
  porte_corporal?: string;

  @ApiProperty({ description: 'Data do registro (opcional)', required: false, example: '2025-02-10' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dt_registro?: Date;

  @ApiProperty({ description: 'Tipo de pesagem', example: 'Pesagem mensal' })
  @IsString()
  @IsNotEmpty()
  tipo_pesagem: string;
}
