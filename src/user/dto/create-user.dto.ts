import { IsString, IsEmail, IsDateString, IsArray, IsOptional, ValidateNested, Matches } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

class EnderecoDto {
  @ApiProperty()
  @IsString()
  estado: string;

  @ApiProperty()
  @IsString()
  bairro: string;

  @ApiProperty()
  @IsString()
  rua: string;

  @ApiProperty()
  @IsString()
  cidade: string;
}

export class CreateUserDto {
  @ApiProperty({ description: 'Nome do usuário' })
  @IsString()
  nome: string;

  @ApiProperty({ description: 'E-mail do usuário', example: 'usuario@email.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({ description: 'Telefone no formato (XX) XXXXX-XXXX' })
  @IsString()
  @Matches(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, {
    message: 'Telefone inválido. Use o formato (XX) XXXXX-XXXX',
  })
  telefone: string;

  @ApiProperty({ description: 'Data de nascimento', type: 'string', format: 'date' })
  @IsDateString()
  @Transform(({ value }) => {
    const date = new Date(value);
    const now = new Date();
    if (date >= now) {
      throw new Error('Data de nascimento deve ser no passado');
    }
    return date;
  })
  dataNascimento: Date;

  @ApiProperty({ description: 'Cargo do usuário' })
  @IsString()
  cargo: string;

  @ApiPropertyOptional({
    description: 'Endereços do usuário',
    type: [EnderecoDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnderecoDto)
  endereco?: EnderecoDto[];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ description: 'Nome do usuário' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'E-mail do usuário' })
  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;

  @ApiPropertyOptional({ description: 'Telefone do usuário' })
  @IsOptional()
  @IsString()
  @Matches(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, {
    message: 'Telefone inválido. Use o formato (XX) XXXXX-XXXX',
  })
  telefone?: string;

  @ApiPropertyOptional({ description: 'Data de nascimento' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => {
    if (value) {
      const date = new Date(value);
      const now = new Date();
      if (date >= now) {
        throw new Error('Data de nascimento deve ser no passado');
      }
      return date;
    }
    return value;
  })
  dataNascimento?: Date;

  @ApiPropertyOptional({ description: 'Cargo do usuário' })
  @IsOptional()
  @IsString()
  cargo?: string;

  @ApiPropertyOptional({ description: 'Endereços do usuário', type: [EnderecoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnderecoDto)
  endereco?: EnderecoDto[];
}
