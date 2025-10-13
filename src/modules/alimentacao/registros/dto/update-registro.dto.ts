import { PartialType } from '@nestjs/swagger';
import { CreateRegistroAlimentacaoDto } from './create-registro.dto';

/**
 * DTO para atualização de registro de alimentação
 * 
 * Endpoint: PATCH /alimentacao/registros/:id
 * 
 * Todos os campos são opcionais. Apenas os campos fornecidos serão atualizados.
 * Campos comumente atualizados: quantidade, freq_dia, dt_registro
 */
export class UpdateRegistroAlimentacaoDto extends PartialType(CreateRegistroAlimentacaoDto) {}
