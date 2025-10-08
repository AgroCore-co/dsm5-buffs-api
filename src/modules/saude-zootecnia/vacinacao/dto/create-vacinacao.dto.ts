import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsUUID, IsBoolean, IsNumber } from 'class-validator';

export class CreateVacinacaoDto {
  @ApiProperty({ example: 3, description: 'ID da vacina na tabela Medicacoes' })
  @IsUUID()
  @IsNotEmpty()
  id_medicacao: string;

  @ApiProperty({ example: '2025-08-18', description: 'Data em que a vacina foi aplicada' })
  @IsDateString()
  @IsNotEmpty()
  dt_aplicacao: string;

  @ApiProperty({ example: 2.0, description: 'Dosagem aplicada', required: false })
  @IsNumber()
  @IsOptional()
  dosagem?: number;

  @ApiProperty({ example: 'ml', description: 'Unidade de medida da dosagem', required: false })
  @IsString()
  @IsOptional()
  unidade_medida?: string;

  @ApiProperty({ example: 'Vacinação Preventiva', description: 'Doença/prevenção', required: false })
  @IsString()
  @IsOptional()
  doenca?: string;

  @ApiProperty({ example: false, description: 'Se necessita retorno', required: false })
  @IsBoolean()
  @IsOptional()
  necessita_retorno?: boolean;

  @ApiProperty({ example: '2026-08-18', description: 'Data de retorno se necessário', required: false })
  @IsDateString()
  @IsOptional()
  dt_retorno?: string;
}
