import { Module } from '@nestjs/common';
import { BufaloService } from './bufalo.service';
import { BufaloController } from './bufalo.controller';
import { RacaModule } from './raca/raca.module';
import { GrupoModule } from './grupo/grupo.module';
import { SupabaseModule } from '../../core/supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    SupabaseModule,
    AuthModule, // Importamos para ter acesso aos provedores de autenticação, como o Guard
    RacaModule, // Módulo de raças
    GrupoModule, // Módulo de grupos
  ],
  controllers: [BufaloController],
  providers: [BufaloService],
})
export class RebanhoModule {}
