import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class SimularAcasalamentoDto {
  @ApiProperty({ description: 'ID do búfalo macho', example: 10 })
  @IsInt()
  @IsPositive()
  id_macho: number;

  @ApiProperty({ description: 'ID da búfala fêmea', example: 15 })
  @IsInt()
  @IsPositive()
  id_femea: number;
}