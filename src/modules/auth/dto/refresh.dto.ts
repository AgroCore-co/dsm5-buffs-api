import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO para renovação de token
 *
 * Endpoint: POST /auth/refresh
 */
export class RefreshDto {
  @ApiProperty({
    description: 'Token de refresh obtido no login',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token é obrigatório' })
  refresh_token: string;
}
