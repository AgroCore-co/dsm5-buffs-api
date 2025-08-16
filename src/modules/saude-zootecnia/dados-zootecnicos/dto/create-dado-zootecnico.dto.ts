import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

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

  @Type(() => Date) // Garante a transformação de string para objeto Date
  @IsDate() // Valida se o resultado é um objeto Date válido
  @IsOptional()
  dt_registro?: Date;

  @IsString()
  @IsNotEmpty()
  tipo_pesagem: string;
}
