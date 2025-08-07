import { IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsNumber, IsDateString, IsUUID } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { SexoEnum, MaturidadeEnum, StatusEnum, ProximoRetornoEnum } from '../entities/buffalo.entity';

class AtividadeDto {
  @ApiProperty({ enum: StatusEnum })
  @IsEnum(StatusEnum)
  status: StatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiProperty()
  @IsDateString()
  dataAtualizacao: Date;
}

class ZootecnicoDto {
  @ApiProperty()
  @IsNumber()
  peso: number;

  @ApiProperty()
  @IsString()
  condicaoCorporal: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiProperty()
  @IsDateString()
  dataAtualizacao: Date;

  @ApiProperty({ type: [String], description: 'UUIDs dos funcionários responsáveis' })
  @IsArray()
  @IsUUID('4', { each: true })
  funcionarioResponsavel: string[];
}

class SanitarioDto {
  @ApiProperty({ description: 'Tipo sanitário: Vacinação, Vermífugo, Tratamento' })
  @IsString()
  tpSanitario: string;

  @ApiProperty()
  @IsString()
  medicacaoAplicada: string;

  @ApiProperty()
  @IsDateString()
  dataAplicacao: Date;

  @ApiProperty({ enum: ProximoRetornoEnum })
  @IsEnum(ProximoRetornoEnum)
  proximoRetorno: ProximoRetornoEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dataRetorno?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiProperty()
  @IsNumber()
  dosagem: number;

  @ApiProperty()
  @IsString()
  unidadeMedidaDosagem: string;

  @ApiProperty()
  @IsString()
  doencaCombatida: string;

  @ApiProperty({ type: [String], description: 'UUIDs dos funcionários responsáveis' })
  @IsArray()
  @IsUUID('4', { each: true })
  funcionarioResponsavel: string[];
}

export class CreateBuffaloDto {
  @ApiProperty({ description: 'Tag única do búfalo' })
  @IsString()
  tag: string;

  @ApiPropertyOptional({ description: 'Nome do búfalo' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ enum: SexoEnum, description: 'Sexo do búfalo' })
  @IsEnum(SexoEnum)
  sexo: SexoEnum;

  @ApiProperty({ enum: MaturidadeEnum, description: 'Maturidade do búfalo' })
  @IsEnum(MaturidadeEnum)
  maturidade: MaturidadeEnum;

  @ApiProperty({ description: 'Raça do búfalo' })
  @IsString()
  raca: string;

  @ApiProperty({ description: 'Tag do pai' })
  @IsString()
  tagPai: string;

  @ApiProperty({ description: 'Tag da mãe' })
  @IsString()
  tagMae: string;

  @ApiPropertyOptional({ description: 'UUID do lote (localização)' })
  @IsOptional()
  @IsUUID()
  localizacao_id?: string;

  @ApiProperty({ description: 'Grupo: Lactando, Secagem, etc.' })
  @IsString()
  grupo: string;

  @ApiPropertyOptional({ type: [AtividadeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AtividadeDto)
  atividade?: AtividadeDto[];

  @ApiPropertyOptional({ type: [ZootecnicoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ZootecnicoDto)
  zootecnico?: ZootecnicoDto[];

  @ApiPropertyOptional({ type: [SanitarioDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SanitarioDto)
  sanitario?: SanitarioDto[];
}

export class UpdateBuffaloDto extends PartialType(CreateBuffaloDto) {
  @ApiPropertyOptional({ description: 'Tag única do búfalo' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ enum: MaturidadeEnum })
  @IsOptional()
  @IsEnum(MaturidadeEnum)
  maturidade?: MaturidadeEnum;

  @ApiPropertyOptional({ description: 'Raça do búfalo' })
  @IsOptional()
  @IsString()
  raca?: string;

  @ApiPropertyOptional({ description: 'Tag do pai' })
  @IsOptional()
  @IsString()
  tagPai?: string;

  @ApiPropertyOptional({ description: 'Tag da mãe' })
  @IsOptional()
  @IsString()
  tagMae?: string;

  @ApiPropertyOptional({ description: 'UUID do lote (localização)' })
  @IsOptional()
  @IsUUID()
  localizacao_id?: string;

  @ApiPropertyOptional({ description: 'Grupo do búfalo' })
  @IsOptional()
  @IsString()
  grupo?: string;
}

export class AddHistoricoBuffaloDto {
  @ApiPropertyOptional({ type: [ZootecnicoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ZootecnicoDto)
  zootecnico?: ZootecnicoDto[];

  @ApiPropertyOptional({ type: [SanitarioDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SanitarioDto)
  sanitario?: SanitarioDto[];

  @ApiPropertyOptional({ type: [AtividadeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AtividadeDto)
  atividade?: AtividadeDto[];
}
