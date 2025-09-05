import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateVacinacaoDto {
  @ApiProperty({ example: 'Vacina contra Febre Aftosa', description: 'Nome comercial da vacina aplicada' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome_vacina: string;

  @ApiProperty({ example: '1ª Dose', description: 'Dose aplicada (ex: dose única, reforço)', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  dose?: string;

  @ApiProperty({ example: '2025-08-18', description: 'Data em que a vacina foi aplicada' })
  @IsDateString()
  @IsNotEmpty()
  dt_aplicacao: string;

  @ApiProperty({ example: '2026-08-18', description: 'Data agendada para a próxima dose ou reforço', required: false })
  @IsDateString()
  @IsOptional()
  dt_revacinacao?: string;

  @ApiProperty({ example: 'LOTE-XYZ-123', description: 'Número do lote da vacina', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  lote_vacina?: string;

  @ApiProperty({ example: 'Farmacêutica VetBR', description: 'Fabricante da vacina', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  fabricante?: string;

  @ApiProperty({ example: 'Animal apresentou febre baixa após a aplicação.', description: 'Observações adicionais', required: false })
  @IsString()
  @IsOptional()
  observacao?: string;
}
