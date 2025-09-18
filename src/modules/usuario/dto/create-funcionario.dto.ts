import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsInt, MaxLength, IsEmail } from 'class-validator';

export class CreateFuncionarioDto {
  @ApiProperty({
    description: 'Nome completo do funcionário.',
    example: 'Carlos Pereira',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @ApiProperty({
    description: 'Email do funcionário para login.',
    example: 'carlos.pereira@buffs.com',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;

  @ApiProperty({
    description: 'Número de telefone para contato.',
    example: '(11) 99999-8888',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(15)
  telefone?: string;

  @ApiProperty({
    description: 'Cargo ou função do funcionário na propriedade.',
    example: 'Funcionário',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  cargo?: string;

  @ApiProperty({
    description: 'ID do endereço associado ao funcionário. Deve corresponder a um endereço já cadastrado.',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  id_endereco?: number;

  @ApiProperty({
    description: 'ID da propriedade onde o funcionário irá trabalhar. Se não fornecido, será vinculado às propriedades do proprietário.',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  id_propriedade?: number;
}
