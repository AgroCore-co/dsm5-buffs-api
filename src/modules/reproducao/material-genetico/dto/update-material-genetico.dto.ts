import { PartialType } from '@nestjs/swagger';
import { CreateMaterialGeneticoDto } from './create-material-genetico.dto';

export class UpdateMaterialGeneticoDto extends PartialType(CreateMaterialGeneticoDto) {}
