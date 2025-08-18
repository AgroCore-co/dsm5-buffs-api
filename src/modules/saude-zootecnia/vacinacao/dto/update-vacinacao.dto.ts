import { PartialType } from '@nestjs/swagger';
import { CreateVacinacaoDto } from './create-vacinacao.dto';

export class UpdateVacinacaoDto extends PartialType(CreateVacinacaoDto) {}
