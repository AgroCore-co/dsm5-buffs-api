import { PartialType } from '@nestjs/swagger';
import { CreateCicloLactacaoDto } from './create-ciclo-lactacao.dto';

export class UpdateCicloLactacaoDto extends PartialType(CreateCicloLactacaoDto) {}


