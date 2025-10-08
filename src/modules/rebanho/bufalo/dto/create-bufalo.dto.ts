import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  MaxLength,
  IsDate,
  IsEnum,
  IsPositive,
  ValidateIf,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BufaloValidationUtils } from '../utils/validation.utils';
import { CategoriaABCB } from './categoria-abcb.dto';

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

// Validador customizado para idade máxima de 50 anos
@ValidatorConstraint({ name: 'MaxAgeValidator', async: false })
export class MaxAgeValidator implements ValidatorConstraintInterface {
  validate(birthDate: Date, args: ValidationArguments) {
    return BufaloValidationUtils.validateMaxAge(birthDate);
  }

  defaultMessage(args: ValidationArguments) {
    return 'O búfalo não pode ter mais de 50 anos de idade';
  }
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

  @ApiProperty({
    description: 'Código de identificação do microchip do búfalo.',
    example: '982000444998877',
    required: false,
    maxLength: 30,
  })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  microchip?: string;

  @ApiProperty({
    description:
      'Data de nascimento do búfalo. A idade máxima permitida é 50 anos. O nível de maturidade será calculado automaticamente baseado na idade e sexo.',
    example: '2023-05-20T00:00:00.000Z',
    required: false,
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  @Validate(MaxAgeValidator)
  dt_nascimento?: Date;

  @ApiProperty({
    description:
      'Nível de maturidade (B-Bezerro, N-Novilho/Novilha, V-Vaca, T-Touro). Se não informado, será calculado automaticamente baseado na data de nascimento e sexo. Bezerro: 0-12 meses, Novilho/Novilha: 12-24 meses, Vaca: após primeira cria (~3 anos), Touro: machos reprodutores a partir de 24 meses.',
    enum: NivelMaturidade,
    example: NivelMaturidade.NOVILHO_NOVILHA,
    required: false,
  })
  @IsEnum(NivelMaturidade)
  @IsOptional()
  nivel_maturidade?: NivelMaturidade;

  @ApiProperty({
    description: 'Sexo do búfalo (M ou F).',
    enum: SexoBufalo,
    example: SexoBufalo.FEMEA,
  })
  @IsEnum(SexoBufalo)
  @IsNotEmpty()
  sexo: SexoBufalo;

  @ApiProperty({
    description: 'ID da raça do búfalo. Se não informado e houver dados zootécnicos, o sistema tentará sugerir automaticamente usando IA.',
    example: 'b8c4a72d-1234-4567-8901-234567890123',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  id_raca?: string;

  @ApiProperty({ description: 'ID da propriedade onde o búfalo está localizado.', example: 'b8c4a72d-1234-4567-8901-234567890123' })
  @IsUUID()
  @IsNotEmpty()
  id_propriedade: string;

  @ApiProperty({ description: 'ID do grupo ao qual o búfalo pertence.', example: 'b8c4a72d-1234-4567-8901-234567890123', required: false })
  @IsUUID()
  @IsOptional()
  id_grupo?: string;

  @ApiProperty({ description: 'ID do búfalo pai (se houver).', example: 'b8c4a72d-1234-4567-8901-234567890123', required: false })
  @IsUUID()
  @IsOptional()
  id_pai?: string;

  @ApiProperty({ description: 'ID da búfala mãe (se houver).', example: 'b8c4a72d-1234-4567-8901-234567890123', required: false })
  @IsUUID()
  @IsOptional()
  id_mae?: string;

  @ApiProperty({
    description:
      'Status do búfalo (true para ativo, false para inativo). Será automaticamente definido como false se a idade for superior a 50 anos.',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  status?: boolean = true;

  @ApiProperty({
    description: 'Categoria ABCB do animal (PO, PC, PA, CCG, SRD). Se não informada, será calculada automaticamente baseada na genealogia.',
    enum: CategoriaABCB,
    example: CategoriaABCB.PA,
    required: false,
  })
  @IsEnum(CategoriaABCB)
  @IsOptional()
  categoria?: CategoriaABCB;
}
