import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateRacaDto {
  @ApiProperty({
    description: 'Nome da raça do búfalo.',
    example: 'Murrah',
    maxLength: 50,
  })
  @IsString({ message: 'O nome da raça deve ser uma string' })
  @IsNotEmpty({ message: 'O nome da raça é obrigatório' })
  @MaxLength(50, { message: 'O nome da raça deve ter no máximo 50 caracteres' })
  nome: string;
}
