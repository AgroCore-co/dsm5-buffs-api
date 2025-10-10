import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsDateString, IsString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

const tiposInseminacao = ['IA', 'Monta Natural', 'TE'];
const statusValidos = ['Em andamento', 'Confirmada', 'Falhou', 'Concluída'];

export class CreateCoberturaDto {
  @ApiProperty({ description: 'ID da propriedade onde a cobertura foi realizada (UUID)', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID()
  @IsNotEmpty()
  id_propriedade: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'ID do material genético do sêmen (para IA ou TE)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  id_semen?: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'ID do material genético da doadora (óvulo/embrião para TE)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  id_doadora?: string;

  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', description: 'ID da fêmea receptora (quem está sendo coberta)' })
  @IsUUID()
  @IsNotEmpty()
  id_bufala: string;

  @ApiProperty({ example: 'IA', description: 'Tipo de inseminação', enum: tiposInseminacao })
  @IsString()
  @IsNotEmpty()
  @IsIn(tiposInseminacao)
  tipo_inseminacao: string;

  @ApiProperty({ example: '2025-08-18', description: 'Data do evento (inseminação ou monta)' })
  @IsDateString()
  @IsNotEmpty()
  dt_evento: string;

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
