import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsDateString, IsBoolean, IsString, IsNumber, MaxLength, IsPositive } from 'class-validator';

export class CreateColetaDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', description: 'ID da indústria que realizou a coleta' })
  @IsUUID()
  @IsNotEmpty()
  id_industria: string;

  @ApiProperty({ description: 'ID da propriedade onde a coleta foi realizada (UUID)', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID()
  @IsNotEmpty()
  id_propriedade: string;

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
  dt_coleta: string;
}
