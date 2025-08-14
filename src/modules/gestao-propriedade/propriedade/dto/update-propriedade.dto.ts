import { PartialType } from '@nestjs/swagger';
import { CreatePropriedadeDto } from './create-propiedade.dto';

export class UpdatePropriedadeDto extends PartialType(CreatePropriedadeDto) {}
