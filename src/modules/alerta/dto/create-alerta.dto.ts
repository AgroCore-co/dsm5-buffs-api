import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional, IsInt, IsPositive, IsBoolean } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export enum NichoAlerta {
  CLINICO = 'CLINICO',
  SANITARIO = 'SANITARIO',
  REPRODUCAO = 'REPRODUCAO',
  MANEJO = 'MANEJO',
}

export enum PrioridadeAlerta {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
}

export class CreateAlertaDto {
  @ApiProperty({ description: 'ID do búfalo relacionado ao alerta', example: 12 })
  @IsInt()
  @IsPositive()
  animal_id: number;

  @ApiProperty({ description: 'Nome do grupo/lote do animal', example: 'Lote A-01' })
  @IsString()
  @IsNotEmpty()
  grupo: string;

  @ApiProperty({ description: 'Nome da propriedade onde o animal está', example: 'Fazenda Santa Clara' })
  @IsString()
  @IsNotEmpty()
  localizacao: string;

  @ApiProperty({ description: 'Motivo detalhado do alerta', example: 'Previsão de parto para os próximos 15 dias.' })
  @IsString()
  @IsNotEmpty()
  motivo: string;

  @ApiProperty({ description: 'Categoria do alerta', enum: NichoAlerta, example: NichoAlerta.REPRODUCAO })
  @IsEnum(NichoAlerta)
  @IsNotEmpty()
  nicho: NichoAlerta;

  @ApiProperty({ description: 'Data prevista para o evento do alerta', example: '2025-10-25T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  data_alerta: string;

  @ApiProperty({ description: 'Prioridade do alerta', enum: PrioridadeAlerta, example: PrioridadeAlerta.MEDIA })
  @IsEnum(PrioridadeAlerta)
  @IsNotEmpty()
  prioridade: PrioridadeAlerta;

  @ApiProperty({ description: 'Observações adicionais', required: false, example: 'Animal de primeira cria.' })
  @IsString()
  @IsOptional()
  observacao?: string;

  @ApiProperty({ description: 'Indica se o alerta já foi visualizado', example: false, required: false })
  @IsBoolean()
  @IsOptional()
  visto?: boolean;
}

export class UpdateAlertaDto extends PartialType(CreateAlertaDto) {}
