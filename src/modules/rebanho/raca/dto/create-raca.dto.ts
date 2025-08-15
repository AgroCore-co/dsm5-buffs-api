import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateRacaDto {
  @ApiProperty({
    description: 'Nome da raça do búfalo.',
    example: 'Murrah',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nome: string;
}
