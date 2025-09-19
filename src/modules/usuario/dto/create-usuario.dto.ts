import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsInt, MaxLength } from 'class-validator';

export class CreateUsuarioDto {
  @ApiProperty({
    description: 'Nome completo do proprietário.',
    example: 'João Silva',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @ApiProperty({
    description: 'Número de telefone para contato.',
    example: '11999998888',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(15)
  telefone?: string;

  @ApiProperty({
    description: 'ID do endereço associado ao usuário. Deve corresponder a um endereço já cadastrado.',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  id_endereco?: number;

  // NOTA: Campo 'cargo' removido - será sempre definido como PROPRIETARIO automaticamente
}