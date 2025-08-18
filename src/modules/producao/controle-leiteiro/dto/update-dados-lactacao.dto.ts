import { PartialType } from '@nestjs/swagger';
import { CreateDadosLactacaoDto } from './create-dados-lactacao.dto';

export class UpdateDadosLactacaoDto extends PartialType(CreateDadosLactacaoDto) {}


