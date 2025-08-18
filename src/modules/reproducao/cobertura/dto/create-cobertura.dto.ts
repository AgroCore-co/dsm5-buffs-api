import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsDateString, IsString, IsIn } from 'class-validator';

const tiposInseminacao = ['IA', 'Monta Natural', 'TE'];
const statusValidos = ['Em andamento', 'Confirmada', 'Falhou', 'Concluída'];

export class CreateCoberturaDto {
  @ApiProperty({
    example: 1,
    description: 'ID do material genético do sêmen (para IA ou TE)',
    required: false,
  })
  @IsInt()
  @IsOptional()
  id_semen?: number;

  @ApiProperty({
    example: 2,
    description: 'ID do material genético da doadora (óvulo/embrião para TE)',
    required: false,
  })
  @IsInt()
  @IsOptional()
  id_doadora?: number;

  @ApiProperty({ example: 15, description: 'ID da fêmea receptora (quem está sendo coberta)' })
  @IsInt()
  @IsNotEmpty()
  id_receptora: number;

  @ApiProperty({ example: 'IA', description: 'Tipo de inseminação', enum: tiposInseminacao })
  @IsString()
  @IsNotEmpty()
  @IsIn(tiposInseminacao)
  tipo_inseminacao: string;

  @ApiProperty({ example: '2025-08-18', description: 'Data do evento (inseminação ou monta)' })
  @IsDateString()
  @IsNotEmpty()
  dt_evento: Date;

  @ApiProperty({
    example: 'Em andamento',
    description: 'Status inicial do processo reprodutivo',
    enum: statusValidos,
    required: false,
    default: 'Em andamento',
  })
  @IsString()
  @IsOptional()
  @IsIn(statusValidos)
  status?: string;
}
