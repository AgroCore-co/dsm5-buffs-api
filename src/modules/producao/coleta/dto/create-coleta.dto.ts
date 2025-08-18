import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsDateString, IsBoolean, IsString, IsNumber, MaxLength, IsPositive } from 'class-validator';

export class CreateColetaDto {
  @ApiProperty({ example: 1, description: 'ID da indústria que realizou a coleta' })
  @IsInt()
  @IsNotEmpty()
  id_industria: number;

  @ApiProperty({ example: true, description: 'Resultado do teste de qualidade do leite (aprovado/reprovado)', required: false })
  @IsBoolean()
  @IsOptional()
  resultado_teste?: boolean;

  @ApiProperty({ example: 'Leite com acidez um pouco elevada.', description: 'Observações sobre a coleta', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  observacao?: string;

  @ApiProperty({ example: 250.5, description: 'Quantidade de leite coletado (em litros)' })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  quantidade: number;

  @ApiProperty({ example: '2025-08-18T08:30:00.000Z', description: 'Data e hora da coleta' })
  @IsDateString()
  @IsNotEmpty()
  dt_coleta: Date;
}
