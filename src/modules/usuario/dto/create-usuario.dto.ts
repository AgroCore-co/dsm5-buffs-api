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
  // ...existing code...
  @MaxLength(15)
  telefone?: string;
  // NOTA: Campo 'cargo' removido - será sempre definido como PROPRIETARIO automaticamente
}