import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsIn } from 'class-validator';

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
    description: 'Nível de maturidade do grupo (B-Bebê, N-Novilho, V-Vaca, T-Touro).',
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
