import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsInt, MaxLength, IsEmail, IsEnum } from 'class-validator';
import { Cargo } from '../enums/cargo.enum';

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
    description: 'Senha temporária para o primeiro acesso do funcionário.',
    example: 'senha123',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  password: string;

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
    description: 'Cargo do funcionário no sistema',
    enum: Cargo,
    example: Cargo.FUNCIONARIO,
    required: true,
  })
  @IsEnum(Cargo, {
    message: 'Cargo deve ser: GERENTE, FUNCIONARIO ou VETERINARIO'
  })
  @IsNotEmpty()
  cargo: Cargo;

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
