import { PartialType } from '@nestjs/mapped-types';
import { CreateDadoZootecnicoDto } from './create-dado-zootecnico.dto';

export class UpdateDadoZootecnicoDto extends PartialType(CreateDadoZootecnicoDto) {}