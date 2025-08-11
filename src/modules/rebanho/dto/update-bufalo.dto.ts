import { PartialType } from '@nestjs/swagger';
import { CreateBufaloDto } from './create-bufalo.dto';

export class UpdateBufaloDto extends PartialType(CreateBufaloDto) {}
