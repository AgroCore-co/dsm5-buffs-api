import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateMedicacaoDto {
  @ApiProperty({ description: 'Tipo de tratamento', example: 'Vermifugação' })
  @IsString()
  @MaxLength(30)
  tipo_tratamento: string;

  @ApiProperty({ description: 'Nome da medicação', example: 'Ivermectina' })
  @IsString()
  @MaxLength(30)
  medicacao: string;

  @ApiProperty({ description: 'Descrição da medicação', example: 'Antiparasitário de amplo espectro', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  descricao?: string;
}
