import { IsEnum, IsNumber, IsOptional, IsArray, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TipoRelatorio {
  REBANHO = 'rebanho',
  REPRODUCAO = 'reproducao',
  LACTACAO = 'lactacao',
}

export class CreateRelatorioDto {
  @ApiProperty({
    enum: TipoRelatorio,
    description: 'O tipo de relatório pré-definido a ser gerado.',
    example: TipoRelatorio.REBANHO,
  })
  @IsEnum(TipoRelatorio)
  template: TipoRelatorio;

  @ApiProperty({
    description: 'O ID da propriedade para a qual o relatório será gerado.',
    example: 1,
  })
  @IsNumber()
  id_propriedade: number;

  @ApiProperty({
    required: false,
    type: [Number],
    description: 'Uma lista opcional de IDs de búfalos para filtrar o relatório. Se não for fornecido, todos os animais da propriedade (respeitando outros filtros) serão incluídos.',
    example: [1, 5, 12],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  ids_bufalos?: number[];

  @ApiProperty({
    required: false,
    description: 'Data de início opcional para filtrar os registros (formato AAAA-MM-DD). A coluna de data a ser filtrada depende do template escolhido (ex: data de nascimento para rebanho).',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  data_inicio?: string;

  @ApiProperty({
    required: false,
    description: 'Data de fim opcional para filtrar os registros (formato AAAA-MM-DD).',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  data_fim?: string;
}
