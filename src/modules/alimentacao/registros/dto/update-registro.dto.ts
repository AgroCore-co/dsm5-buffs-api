import { PartialType } from '@nestjs/swagger';
import { CreateRegistroAlimentacaoDto } from './create-registro.dto';

export class UpdateRegistroAlimentacaoDto extends PartialType(CreateRegistroAlimentacaoDto) {}


