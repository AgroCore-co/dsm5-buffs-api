import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean, IsUUID, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { NivelMaturidade, SexoBufalo } from './create-bufalo.dto';

export class FiltroAvancadoBufaloDto {
  // Filtros de búfalo
  @ApiProperty({
    description: 'ID da raça para filtrar',
    example: 'b8c4a72d-1234-4567-8901-234567890123',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  id_raca?: string;

  @ApiProperty({
    description: 'Sexo do búfalo (M ou F)',
    enum: SexoBufalo,
    example: SexoBufalo.FEMEA,
    required: false,
  })
  @IsEnum(SexoBufalo)
  @IsOptional()
  sexo?: SexoBufalo;

  @ApiProperty({
    description: 'Nível de maturidade (B-Bezerro, N-Novilho/Novilha, V-Vaca, T-Touro)',
    enum: NivelMaturidade,
    example: NivelMaturidade.NOVILHO_NOVILHA,
    required: false,
  })
  @IsEnum(NivelMaturidade)
  @IsOptional()
  nivel_maturidade?: NivelMaturidade;

  @ApiProperty({
    description: 'Status do búfalo (true para ativo, false para inativo)',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    // Se já é boolean, retorna como está
    if (typeof value === 'boolean') return value;

    // Converte strings para boolean
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;

    // Se for undefined ou null, retorna undefined
    if (value === undefined || value === null || value === '') return undefined;

    return value;
  })
  status?: boolean;

  @ApiProperty({
    description: 'Início do código do brinco para busca progressiva (ex: "IZ", "IZ-0", "IZ-001")',
    example: 'IZ',
    required: false,
  })
  @IsString()
  @IsOptional()
  brinco?: string;

  // Paginação
  @ApiProperty({
    description: 'Número da página (começa em 1)',
    example: 1,
    required: false,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Número de itens por página (máximo 100)',
    example: 10,
    required: false,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;
}
