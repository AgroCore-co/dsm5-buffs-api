import { PartialType } from '@nestjs/swagger';
import { CreateMedicacaoDto } from './create-medicacao.dto';

export class UpdateMedicacaoDto extends PartialType(CreateMedicacaoDto) {}
