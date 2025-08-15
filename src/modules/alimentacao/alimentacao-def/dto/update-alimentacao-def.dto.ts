import { PartialType } from '@nestjs/swagger';
import { CreateAlimentacaoDefDto } from './create-alimentacao-def.dto';

export class UpdateAlimentacaoDefDto extends PartialType(CreateAlimentacaoDefDto) {}
