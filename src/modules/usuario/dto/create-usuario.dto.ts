import { ApiProperty } from '@nestjs/swagger';
import { BaseUsuarioDto } from './base-usuario.dto';

/**
 * DTO para criação de perfil de PROPRIETÁRIO
 *
 * Endpoint: POST /usuarios
 *
 * Este DTO é usado após o signup no Supabase Auth.
 * O campo 'cargo' será automaticamente definido como PROPRIETARIO.
 */
export class CreateUsuarioDto extends BaseUsuarioDto {
  // Herda: nome, telefone, id_endereco
  // Nota: Campo 'cargo' será sempre PROPRIETARIO (definido automaticamente no service)
}
