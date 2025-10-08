import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateMedicacaoDto {
  @ApiProperty({ description: 'ID da propriedade onde a medicação está sendo utilizada (UUID)', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID()
  @IsNotEmpty()
  id_propriedade: string;

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
