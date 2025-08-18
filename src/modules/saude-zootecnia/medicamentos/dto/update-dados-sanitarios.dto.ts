import { PartialType } from '@nestjs/swagger';
import { CreateDadosSanitariosDto } from './create-dados-sanitarios.dto';

export class UpdateDadosSanitariosDto extends PartialType(CreateDadosSanitariosDto) {}


