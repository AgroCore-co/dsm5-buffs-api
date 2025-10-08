import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsIn, IsUUID } from 'class-validator';

export class CreateGrupoDto {
  @ApiProperty({
    description: 'Nome do grupo de búfalos.',
    example: 'Grupo de Recria',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nome_grupo: string;

  @ApiProperty({
    description: 'ID da propriedade à qual este grupo pertence (UUID).',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID()
  @IsNotEmpty()
  id_propriedade: string;

  @ApiProperty({
    description: 'Cor associada ao grupo para identificação visual.',
    example: '#FF5733',
    required: false,
    maxLength: 7,
  })
  @IsString()
  @IsOptional()
  @MaxLength(7)
  color?: string;

  @ApiProperty({
    description: 'Nível de maturidade do grupo (B-Bezerro, N-Novilho, V-Vaca, T-Touro).',
    example: 'N',
    required: false,
    maxLength: 1,
    enum: ['B', 'N', 'V', 'T'],
  })
  @IsString()
  @IsOptional()
  @MaxLength(1)
  @IsIn(['B', 'N', 'V', 'T'])
  nivel_maturidade?: string;
}
