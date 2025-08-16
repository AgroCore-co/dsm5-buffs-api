import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, MaxLength, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

// Este DTO define a estrutura de dados para criar um novo búfalo.
// Usamos 'class-validator' para as regras de validação e '@ApiProperty'
// para que o Swagger possa documentar cada campo da API.

export class CreateBufaloDto {
  @ApiProperty({ description: 'Nome de identificação do búfalo.', example: 'Valente' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nome: string;

  @ApiProperty({ description: 'Código do brinco do búfalo.', example: 'BR54321', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  brinco?: string;

  @ApiProperty({ description: 'Data de nascimento do búfalo.', example: '2023-05-20T00:00:00.000Z', required: false })
  @Type(() => Date) // 1. Garante que o valor de entrada será transformado em um objeto Date
  @IsDate() // 2. Valida se o resultado da transformação é um objeto Date válido
  @IsOptional()
  dt_nascimento?: Date;

  @ApiProperty({ description: 'Nível de maturidade (B-Bebê, N-Novilho, V-Vaca, T-Touro).', example: 'N', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(1)
  nivel_maturidade?: string;

  @ApiProperty({ description: 'Sexo do búfalo (M ou F).', example: 'M' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1)
  sexo: string;

  @ApiProperty({ description: 'ID da raça do búfalo.', example: 1 })
  @IsInt()
  @IsNotEmpty()
  id_raca: number;

  @ApiProperty({ description: 'ID da propriedade onde o búfalo está localizado.', example: 1 })
  @IsInt()
  @IsNotEmpty()
  id_propriedade: number;

  @ApiProperty({ description: 'ID do grupo ao qual o búfalo pertence.', example: 1, required: false })
  @IsInt()
  @IsOptional()
  id_grupo?: number;

  @ApiProperty({ description: 'ID do búfalo pai (se houver).', example: 10, required: false })
  @IsInt()
  @IsOptional()
  id_pai?: number;

  @ApiProperty({ description: 'ID da búfala mãe (se houver).', example: 15, required: false })
  @IsInt()
  @IsOptional()
  id_mae?: number;

  @ApiProperty({ description: 'Status do búfalo (true para ativo, false para inativo).', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  status: boolean = true;
}
