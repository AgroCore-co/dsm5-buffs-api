import { PartialType } from '@nestjs/swagger';
import { CreateMovLoteDto } from './create-mov-lote.dto';

export class UpdateMovLoteDto extends PartialType(CreateMovLoteDto) {}
