import { IsString, IsNumber, IsOptional, IsUUID, IsEnum, IsPositive, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum StatusLotEnum {
  ATIVO = 'Ativo',
  MANUTENCAO = 'Manutenção',
  INATIVO = 'Inativo',
}

export class CreateLotDto {
  @ApiProperty({ description: 'Nome identificador do lote' })
  @IsString()
  nomeLote: string;

  @ApiProperty({ description: 'Tamanho da área do lote' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  tamanhoArea: number;

  @ApiProperty({ description: 'Unidade de medida da área', example: 'hectares' })
  @IsString()
  unidadeMedida: string;

  @ApiPropertyOptional({ description: 'Quantidade máxima de animais que o lote comporta' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  qtdComporta?: number;

  @ApiProperty({ enum: StatusLotEnum, description: 'Status atual do lote' })
  @IsEnum(StatusLotEnum)
  status: StatusLotEnum;

  @ApiPropertyOptional({ description: 'UUID do usuário responsável pelo lote' })
  @IsOptional()
  @IsUUID()
  responsavel_id?: string;
}

export class UpdateLotDto extends PartialType(CreateLotDto) {
  @ApiPropertyOptional({ description: 'Nome identificador do lote' })
  @IsOptional()
  @IsString()
  nomeLote?: string;

  @ApiPropertyOptional({ description: 'Tamanho da área do lote' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  tamanhoArea?: number;

  @ApiPropertyOptional({ description: 'Unidade de medida da área' })
  @IsOptional()
  @IsString()
  unidadeMedida?: string;

  @ApiPropertyOptional({ description: 'Quantidade máxima de animais' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  qtdComporta?: number;

  @ApiPropertyOptional({ enum: StatusLotEnum, description: 'Status do lote' })
  @IsOptional()
  @IsEnum(StatusLotEnum)
  status?: StatusLotEnum;

  @ApiPropertyOptional({ description: 'UUID do responsável' })
  @IsOptional()
  @IsUUID()
  responsavel_id?: string;
}