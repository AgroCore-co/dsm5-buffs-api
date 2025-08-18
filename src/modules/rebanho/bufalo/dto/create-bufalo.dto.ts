import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, MaxLength, IsDate, IsEnum, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

// Isso melhora a validação, evita erros de digitação e documenta a API no Swagger.
export enum NivelMaturidade {
  BEZERRO = 'B',
  NOVILHO_NOVILHA = 'N',
  VACA = 'V',
  TOURO = 'T',
}

export enum SexoBufalo {
  FEMEA = 'F',
  MACHO = 'M',
}

// Este DTO define a estrutura de dados para criar um novo búfalo.
// Usamos 'class-validator' para as regras de validação e '@ApiProperty'
// para que o Swagger possa documentar cada campo da API.

export class CreateBufaloDto {
  @ApiProperty({ description: 'Nome de identificação do búfalo.', example: 'Valente', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nome: string;

  @ApiProperty({ description: 'Código do brinco do búfalo.', example: 'BR54321', required: false, maxLength: 10 })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  brinco?: string;

  @ApiProperty({ description: 'Data de nascimento do búfalo.', example: '2023-05-20T00:00:00.000Z', required: false })
  // Esta parte está correta: @Type transforma a string do JSON em um objeto Date,
  // e @IsDate valida se a transformação resultou em uma data válida.
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dt_nascimento?: Date;

  // Trocado IsString por IsEnum para garantir que apenas os valores permitidos sejam aceitos.
  @ApiProperty({
    description: 'Nível de maturidade (B-Bezerro, N-Novilho/Novilha, V-Vaca, T-Touro).',
    enum: NivelMaturidade, // Isso informa ao Swagger quais são os valores possíveis.
    example: NivelMaturidade.NOVILHO_NOVILHA,
    required: false,
  })
  @IsEnum(NivelMaturidade)
  @IsOptional()
  nivel_maturidade?: NivelMaturidade;

  // Trocado IsString por IsEnum para o campo 'sexo'.
  @ApiProperty({
    description: 'Sexo do búfalo (M ou F).',
    enum: SexoBufalo,
    example: SexoBufalo.FEMEA,
  })
  @IsEnum(SexoBufalo)
  @IsNotEmpty()
  sexo: SexoBufalo;

  // Adicionado @IsPositive para garantir que o ID seja um número inteiro positivo.
  @ApiProperty({ description: 'ID da raça do búfalo.', example: 1 })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  id_raca: number;

  @ApiProperty({ description: 'ID da propriedade onde o búfalo está localizado.', example: 1 })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  id_propriedade: number;

  @ApiProperty({ description: 'ID do grupo ao qual o búfalo pertence.', example: 1, required: false })
  @IsInt()
  @IsPositive()
  @IsOptional()
  id_grupo?: number;

  @ApiProperty({ description: 'ID do búfalo pai (se houver).', example: 10, required: false })
  @IsInt()
  @IsPositive()
  @IsOptional()
  id_pai?: number;

  @ApiProperty({ description: 'ID da búfala mãe (se houver).', example: 15, required: false })
  @IsInt()
  @IsPositive()
  @IsOptional()
  id_mae?: number;

  @ApiProperty({ description: 'Status do búfalo (true para ativo, false para inativo).', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  // CORREÇÃO: A propriedade deve ser opcional no tipo (`?`) se o decorator `@IsOptional` for usado.
  status?: boolean = true;
}
