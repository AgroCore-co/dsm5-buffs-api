import { PartialType } from '@nestjs/swagger';
import { CreateRacaDto } from './create-raca.dto';

export class UpdateRacaDto extends PartialType(CreateRacaDto) {}
