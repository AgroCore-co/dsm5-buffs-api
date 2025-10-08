import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SimularAcasalamentoDto {
  @ApiProperty({ description: 'ID do búfalo macho', example: 'b8c4a72d-1234-4567-8901-234567890123' })
  @IsUUID()
  id_macho: string;

  @ApiProperty({ description: 'ID da búfala fêmea', example: 'c9d5b83e-2345-5678-9012-345678901234' })
  @IsUUID()
  id_femea: string;
}
