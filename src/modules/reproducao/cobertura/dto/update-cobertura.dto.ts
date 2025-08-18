// Caminho: src/modules/reproducao/cobertura/dto/update-cobertura.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateCoberturaDto } from './create-cobertura.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

const tiposParto = ['Normal', 'Cesárea', 'Aborto'];

export class UpdateCoberturaDto extends PartialType(CreateCoberturaDto) {
  @ApiProperty({
    example: 'Normal',
    description: 'Tipo de parto ocorrido',
    enum: tiposParto,
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(tiposParto)
  tipo_parto?: string;
}
