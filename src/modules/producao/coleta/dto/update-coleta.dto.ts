import { PartialType } from '@nestjs/swagger';
import { CreateColetaDto } from './create-coleta.dto';

export class UpdateColetaDto extends PartialType(CreateColetaDto) {}
