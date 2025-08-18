import { Module } from '@nestjs/common';
import { BufaloModule } from './bufalo/bufalo.module';
import { GrupoModule } from './grupo/grupo.module';
import { RacaModule } from './raca/raca.module';
import { MovLoteModule } from './mov-lote/mov-lote.module';

@Module({
  imports: [BufaloModule, GrupoModule, RacaModule, MovLoteModule],
  exports: [BufaloModule, GrupoModule, RacaModule, MovLoteModule],
})
export class RebanhoModule {}
