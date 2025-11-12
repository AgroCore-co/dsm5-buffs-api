import { PartialType } from '@nestjs/swagger';
import { CreatePropriedadeDto } from './create-propriedade.dto';

export class UpdatePropriedadeDto extends PartialType(CreatePropriedadeDto) {}
