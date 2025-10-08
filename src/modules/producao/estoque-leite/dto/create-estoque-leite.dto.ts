import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsPositive, MaxLength, IsString } from 'class-validator';

export class CreateEstoqueLeiteDto {
  @ApiProperty({ example: 1, description: 'ID da propriedade onde o estoque está localizado' })
  @IsUUID()
  @IsNotEmpty()
  id_propriedade: string;

  @ApiProperty({ example: 1200.75, description: 'Quantidade de leite em estoque (em litros)' })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  quantidade: number;

  @ApiProperty({ example: '2025-08-18T18:00:00.000Z', description: 'Data e hora do registro de estoque', required: false })
  @IsDateString()
  @IsOptional()
  dt_registro?: Date;

  @ApiProperty({ example: 'Tanque principal resfriado a 4°C.', description: 'Observações sobre o estoque', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  observacao?: string;
}
