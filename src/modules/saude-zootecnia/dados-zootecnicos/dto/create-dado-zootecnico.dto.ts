import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateDadoZootecnicoDto {
  @IsNumber()
  @IsNotEmpty()
  peso: number;

  @IsNumber()
  @IsNotEmpty()
  condicao_corporal: number;

  @IsString()
  @IsOptional()
  cor_pelagem?: string;

  @IsString()
  @IsOptional()
  formato_chifre?: string;

  @IsString()
  @IsOptional()
  porte_corporal?: string;
  
  @IsDateString()
  @IsOptional()
  dt_registro?: Date;

  @IsString()
  @IsNotEmpty()
  tipo_pesagem: string;
}