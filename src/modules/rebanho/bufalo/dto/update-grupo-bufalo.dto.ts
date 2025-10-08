import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, IsOptional, IsString, MaxLength, IsUUID } from 'class-validator';

export class UpdateGrupoBufaloDto {
  @ApiProperty({
    description: 'Array com os IDs dos búfalos que terão seu grupo alterado.',
    example: ['b8c4a72d-1234-4567-8901-234567890123', 'c9d5b83e-2345-5678-9012-345678901234'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Pelo menos um búfalo deve ser selecionado.' })
  @IsUUID(4, { each: true, message: 'Todos os IDs devem ser UUIDs válidos.' })
  ids_bufalos: string[];

  @ApiProperty({
    description: 'ID do novo grupo de manejo para estes animais.',
    example: 'b8c4a72d-1234-4567-8901-234567890123',
  })
  @IsUUID()
  id_novo_grupo: string;

  @ApiProperty({
    description: 'Motivo da mudança de grupo (opcional).',
    example: 'Transição para período de secagem',
    required: false,
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  motivo?: string;
}
