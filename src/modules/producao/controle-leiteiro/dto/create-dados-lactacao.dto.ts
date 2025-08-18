import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDadosLactacaoDto {
  @ApiProperty({ description: 'ID da búfala', example: 5 })
  @IsInt()
  id_bufala: number;

  @ApiProperty({ description: 'ID do usuário responsável', example: 2 })
  @IsInt()
  id_usuario: number;

  @ApiProperty({ description: 'Quantidade ordenhada (L)', example: 8.75 })
  @IsNumber()
  qt_ordenha: number;

  @ApiProperty({ description: 'Período (M-manhã, T-tarde, N-noite, etc.)', example: 'M' })
  @IsString()
  @MaxLength(1)
  @IsOptional()
  periodo?: string;

  @ApiProperty({ description: 'Ocorrência', example: 'Mastite leve', required: false })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  ocorrencia?: string;

  @ApiProperty({ description: 'Data/hora da ordenha', example: '2025-02-10T06:00:00.000Z' })
  @IsDateString()
  dt_ordenha: string;
}


