import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';

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
    description: 'ID do endereço associado ao usuário (UUID).',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  id_endereco?: string;

  // NOTA: Campo 'cargo' removido - será sempre definido como PROPRIETARIO automaticamente
}
