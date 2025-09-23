import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, IsInt, IsPositive, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateGrupoBufaloDto {
  @ApiProperty({
    description: 'Array com os IDs dos búfalos que terão seu grupo alterado.',
    example: [15, 17, 21],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Pelo menos um búfalo deve ser selecionado.' })
  @IsInt({ each: true, message: 'Todos os IDs devem ser números inteiros.' })
  ids_bufalos: number[];

  @ApiProperty({
    description: 'ID do novo grupo de manejo para estes animais.',
    example: 5,
  })
  @IsInt()
  @IsPositive()
  id_novo_grupo: number;

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