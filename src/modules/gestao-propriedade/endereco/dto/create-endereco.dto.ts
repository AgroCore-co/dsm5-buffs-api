import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

/**
 * DTO para criação de endereço
 *
 * Endpoint: POST /enderecos
 */
export class CreateEnderecoDto {
  @ApiProperty({
    description: 'Nome do país',
    example: 'Brasil',
  })
  @IsString()
  @IsNotEmpty({ message: 'País é obrigatório' })
  pais: string;

  @ApiProperty({
    description: 'Nome do estado',
    example: 'São Paulo',
  })
  @IsString()
  @IsNotEmpty({ message: 'Estado é obrigatório' })
  estado: string;

  @ApiProperty({
    description: 'Nome da cidade',
    example: 'Presidente Prudente',
  })
  @IsString()
  @IsNotEmpty({ message: 'Cidade é obrigatória' })
  cidade: string;

  @ApiProperty({
    description: 'Nome do bairro',
    example: 'Centro',
    required: false,
  })
  @IsString()
  @IsOptional()
  bairro?: string;

  @ApiProperty({
    description: 'Nome da rua',
    example: 'Rua Principal',
    required: false,
  })
  @IsString()
  @IsOptional()
  rua?: string;

  @ApiProperty({
    description: 'CEP (formato: 00000-000)',
    example: '19000-000',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^\d{5}-\d{3}$/, {
    message: 'CEP deve estar no formato: 00000-000',
  })
  cep?: string;

  @ApiProperty({
    description: 'Número do imóvel',
    example: '123',
    required: false,
  })
  @IsString()
  @IsOptional()
  numero?: string;

  @ApiProperty({
    description: 'Ponto de referência para localização',
    example: 'Próximo à ponte',
    required: false,
  })
  @IsString()
  @IsOptional()
  ponto_referencia?: string;
}
