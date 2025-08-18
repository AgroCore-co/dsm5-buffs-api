import { PartialType } from '@nestjs/swagger';
import { CreateIndustriaDto } from './create-industria.dto';

export class UpdateIndustriaDto extends PartialType(CreateIndustriaDto) {}
