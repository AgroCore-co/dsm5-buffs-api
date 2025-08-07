import { PartialType } from '@nestjs/swagger';
import { CreateBuffaloDto } from './create-buffalo.dto';

export class UpdateBuffaloDto extends PartialType(CreateBuffaloDto) {}
