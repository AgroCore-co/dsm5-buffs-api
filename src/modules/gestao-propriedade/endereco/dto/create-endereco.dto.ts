import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateEnderecoDto {
  @ApiProperty({ example: 'Brasil' })
  @IsString()
  @IsNotEmpty()
  pais: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  @IsNotEmpty()
  estado: string;

  @ApiProperty({ example: 'Presidente Prudente' })
  @IsString()
  @IsNotEmpty()
  cidade: string;

  @ApiProperty({ required: false, example: 'Centro' })
  @IsString()
  @IsOptional()
  bairro?: string;

  @ApiProperty({ required: false, example: 'Rua Principal' })
  @IsString()
  @IsOptional()
  rua?: string;

  @ApiProperty({ required: false, example: '19000-000' })
  @IsString()
  @IsOptional()
  cep?: string;

  @ApiProperty({ required: false, example: '123' })
  @IsString()
  @IsOptional()
  numero?: string;

  @ApiProperty({ required: false, example: 'Próximo à ponte' })
  @IsString()
  @IsOptional()
  ponto_referencia?: string;
}
