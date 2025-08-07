import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { BuffaloModule } from './buffalo/buffalo.module';
import { LotModule } from './lot/lot.module';

@Module({
  imports: [
    // 1. Módulo de Configuração para carregar variáveis de ambiente (.env)
    ConfigModule.forRoot({
      isGlobal: true, // Torna as variáveis de ambiente disponíveis globalmente
    }),
    // 2. Módulo de Conexão com o Banco de Dados (PostgreSQL/Supabase)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'], // Onde encontrar as entidades
        synchronize: true, // ATENÇÃO: true apenas para desenvolvimento
        ssl: {
          rejectUnauthorized: false, // Necessário para conexões Supabase
        },
      }),
    }),
    UserModule,
    BuffaloModule,
    LotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}