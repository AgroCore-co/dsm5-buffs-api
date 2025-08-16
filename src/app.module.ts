import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './core/supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { RebanhoModule } from './modules/rebanho/bufalo.module';
import { GestaoPropriedadeModule } from './modules/gestao-propriedade/gestao-propriedade.module';
import { AlimentacaoModule } from './modules/alimentacao/alimentacao.module';
import { SaudeZootecniaModule } from './modules/saude-zootecnia/saude-zootecnia.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    UsuarioModule,
    RebanhoModule,
    GestaoPropriedadeModule,
    AlimentacaoModule,
    SaudeZootecniaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
