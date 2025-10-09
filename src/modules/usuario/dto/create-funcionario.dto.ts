import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsUUID, MaxLength, IsEmail, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
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
    enumName: 'Cargo',
    example: Cargo.FUNCIONARIO,
    required: true,
    examples: {
      gerente: {
        value: Cargo.GERENTE,
        description: 'Pode gerenciar usuários mas não propriedades',
      },
      funcionario: {
        value: Cargo.FUNCIONARIO,
        description: 'Acesso apenas às operações básicas',
      },
      veterinario: {
        value: Cargo.VETERINARIO,
        description: 'Acesso apenas às operações básicas',
      },
    },
  })
  @IsEnum(Cargo, {
    message: 'Cargo deve ser: GERENTE, FUNCIONARIO ou VETERINARIO (PROPRIETARIO não é permitido neste endpoint)',
  })
  @IsNotEmpty()
  cargo: Cargo;

  @ApiProperty({
    description: 'ID do endereço associado ao funcionário (UUID). Deve corresponder a um endereço já cadastrado.',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  id_endereco?: string;

  @ApiProperty({
    description: 'ID da propriedade onde o funcionário irá trabalhar (UUID). Se não fornecido, será vinculado às propriedades do proprietário.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  id_propriedade?: string;
}
