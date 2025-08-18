import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateIndustriaDto {
  @ApiProperty({ example: 'Laticínios Búfalo Dourado', description: 'Nome da indústria/laticínio' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nome: string;

  @ApiProperty({ example: 'Carlos Silva', description: 'Nome do representante comercial', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  representante?: string;

  @ApiProperty({ example: '(13) 99999-8888', description: 'Telefone ou email de contato', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  contato?: string;

  @ApiProperty({ example: 'Coleta realizada às segundas e quintas.', description: 'Observações gerais', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  observacao?: string;
}
