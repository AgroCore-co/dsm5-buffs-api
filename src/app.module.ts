import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './core/supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { RebanhoModule } from './modules/rebanho/bufalo.module';
import { GestaoPropriedadeModule } from './modules/gestao-propriedade/gestao-propriedade.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    UsuarioModule,
    RebanhoModule,
    GestaoPropriedadeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
