import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsUUID } from 'class-validator';

export class CreateIndustriaDto {
  @ApiProperty({ description: 'ID da propriedade à qual esta indústria está vinculada (UUID)', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID()
  @IsNotEmpty()
  id_propriedade: string;

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
