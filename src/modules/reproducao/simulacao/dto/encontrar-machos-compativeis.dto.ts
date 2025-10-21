import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsUUID } from 'class-validator';

export class EncontrarMachosCompativeisDto {
  @ApiProperty({ description: 'ID da búfala fêmea', example: 'b8c4a72d-1234-4567-8901-234567890123' })
  @IsUUID()
  id_femea: string;

  @ApiProperty({ 
    description: 'Consanguinidade máxima aceitável em %', 
    example: 6.25,
    required: false,
    default: 6.25
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => parseFloat(value))
  max_consanguinidade?: number = 6.25;
}