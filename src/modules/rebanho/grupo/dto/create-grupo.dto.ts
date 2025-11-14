import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsIn, IsUUID } from 'class-validator';

export class CreateGrupoDto {
  @ApiProperty({
    description: 'Nome do grupo de búfalos.',
    example: 'Grupo de Recria',
    maxLength: 50,
  })
  @IsString({ message: 'O nome do grupo deve ser uma string' })
  @IsNotEmpty({ message: 'O nome do grupo é obrigatório' })
  @MaxLength(50, { message: 'O nome do grupo deve ter no máximo 50 caracteres' })
  nome_grupo: string;

  @ApiProperty({
    description: 'ID da propriedade à qual este grupo pertence (UUID).',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID('4', { message: 'O id_propriedade deve ser um UUID válido' })
  @IsNotEmpty({ message: 'O id_propriedade é obrigatório' })
  id_propriedade: string;

  @ApiProperty({
    description: 'Cor associada ao grupo para identificação visual.',
    example: '#FF5733',
    required: false,
    maxLength: 7,
  })
  @IsString({ message: 'A cor deve ser uma string' })
  @IsOptional()
  @MaxLength(7, { message: 'A cor deve ter no máximo 7 caracteres (formato hexadecimal)' })
  color?: string;
}
