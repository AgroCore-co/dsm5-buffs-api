import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumber, IsPositive, IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';

export enum PeriodoOrdenha {
  MANHA = 'M',
  TARDE = 'T',
  NOITE = 'N',
}

export class CreateDadosLactacaoDto {
  @ApiProperty({ description: 'ID da búfala', example: 5 })
  @IsInt()
  @IsPositive()
  id_bufala: number;


  @ApiProperty({ description: 'Quantidade ordenhada (L)', example: 8.75 })
  @IsNumber()
  @IsPositive()
  qt_ordenha: number;

  @ApiProperty({
    description: 'Período da ordenha',
    example: PeriodoOrdenha.MANHA,
    enum: PeriodoOrdenha,
  })
  @IsEnum(PeriodoOrdenha)
  @IsOptional()
  periodo?: PeriodoOrdenha;

  @ApiProperty({ description: 'Ocorrência', example: 'Mastite leve', required: false })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  ocorrencia?: string;

  @ApiProperty({ description: 'Data/hora da ordenha', example: '2025-02-10T06:00:00.000Z' })
  @IsDateString()
  dt_ordenha: string;
}
