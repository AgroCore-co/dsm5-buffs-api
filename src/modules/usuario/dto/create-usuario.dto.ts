import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsInt, MaxLength } from 'class-validator';

// Este DTO define a estrutura de dados para criar um novo usuário.
// Usamos 'class-validator' para as regras de validação e '@ApiProperty'
// para que o Swagger possa documentar cada campo da API.

export class CreateUsuarioDto {
  @ApiProperty({
    description: 'Nome completo do usuário.',
    example: 'Fulano de Tal',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @ApiProperty({
    description: 'Número de telefone para contato.',
    example: '11999998888',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(15)
  telefone?: string;

  @ApiProperty({
    description: 'Cargo ou função do usuário na organização.',
    example: 'Gerente de Fazenda',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  cargo?: string;

  @ApiProperty({
    description: 'ID do endereço associado ao usuário. Deve corresponder a um endereço já cadastrado.',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  id_endereco?: number;
}
