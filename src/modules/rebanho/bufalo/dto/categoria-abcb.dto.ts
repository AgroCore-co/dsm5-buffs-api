import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum CategoriaABCB {
  PO = 'PO',   // Puro de Origem - 4+ gerações da mesma raça
  PC = 'PC',   // Puro por Cruzamento - 3+ gerações da mesma raça
  PA = 'PA',   // Puro por Absorção - raça definida sem genealogia completa
  CCG = 'CCG', // Controle de Cruzamento e Genealogia - mestiço com controle
  SRD = 'SRD'  // Sem Raça Definida
}

export class FiltroCategoriaBufaloDto {
  @ApiProperty({ description: 'Categoria ABCB para filtrar', enum: CategoriaABCB, required: false })
  @IsEnum(CategoriaABCB)
  @IsOptional()
  categoria?: CategoriaABCB;
}
