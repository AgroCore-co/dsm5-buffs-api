import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsPositive, IsString, MaxLength, IsUUID } from 'class-validator';

export enum StatusCicloLactacao {
  EM_LACTACAO = 'Em Lactação',
  SECA = 'Seca',
}

export class CreateCicloLactacaoDto {
  @ApiProperty({ description: 'ID da búfala', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID()
  id_bufala: string;

  @ApiProperty({ description: 'ID da propriedade onde o ciclo está sendo registrado (UUID)', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID()
  id_propriedade: string;

  @ApiProperty({ description: 'Data do parto', example: '2025-02-01' })
  @IsDateString()
  dt_parto: string;

  @ApiProperty({ description: 'Padrão de dias do ciclo', example: 305 })
  @IsInt()
  @IsPositive()
  padrao_dias: number;

  @ApiProperty({ description: 'Data real de secagem', required: false, example: '2025-11-10' })
  @IsDateString()
  @IsOptional()
  dt_secagem_real?: string;

  @ApiProperty({ description: 'Observação', required: false, example: 'Parto normal' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  observacao?: string;
}
