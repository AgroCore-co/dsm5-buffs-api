import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateIndustriaDto {
  @ApiProperty({ required: false, maxLength: 20 })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  nome?: string;

  @ApiProperty({ required: false, maxLength: 20 })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  representante?: string;

  @ApiProperty({ required: false, maxLength: 20 })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  contato?: string;

  @ApiProperty({ required: false, maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  observacao?: string;
}
