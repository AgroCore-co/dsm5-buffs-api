import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as dotenv from 'dotenv';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' 
      ? ['error', 'warn'] 
      : ['log', 'debug', 'error', 'verbose', 'warn']
  });
  dotenv.config();

  app.use(helmet({
    crossOriginEmbedderPolicy: false, 
  }));

  const swaggerDescription = `
  Documentação da API para o sistema de gerenciamento de búfalos (BUFFS).

  ## Guia Completo: Criando e Autenticando um Usuário

  Esta API é desacoplada da autenticação. O fluxo completo para um novo usuário é gerenciado pelo cliente (frontend) em conjunto com o Supabase e esta API.

  ---

  ### **Etapa 1: Cadastro (Supabase Auth)**
  O usuário se cadastra no frontend. O frontend **NÃO** chama a nossa API para isso. Ele usa o SDK do Supabase.
  - **Função a ser chamada no frontend:** \`supabase.auth.signUp({ email, password })\`
  - **Resultado:** Uma "conta de acesso" é criada no Supabase. Se a confirmação de email estiver ativa, um email será enviado.

  ---

  ### **Etapa 2: Login e Obtenção do Token (Supabase Auth)**
  Após confirmar o email (se aplicável), o usuário faz login.
  - **Função a ser chamada no frontend:** \`supabase.auth.signInWithPassword()\` ou \`signInWithOAuth({ provider: 'google' })\`
  - **Resultado:** O Supabase retorna uma sessão válida contendo um **access_token (JWT)**. Este token é a chave para acessar nossa API.

  ---

  ### **Etapa 3: Criação do Perfil de Dados (Nossa API)**
  Com o token em mãos, o frontend faz a primeira chamada para nossa API para criar o perfil do usuário.
  - **Endpoint a ser chamado:** \`POST /usuarios\`
  - **Autenticação:** A requisição **DEVE** conter o cabeçalho \`Authorization: Bearer <seu_token_jwt>\`.
  - **Corpo da Requisição:** O corpo deve conter os dados do perfil (nome, telefone, etc.), **MAS NÃO DEVE CONTER O CAMPO 'EMAIL'**, pois ele é extraído automaticamente do token.

  ---

  ### **Etapa 4: Requisições Autenticadas (Nossa API)**
  Para todas as outras operações em endpoints protegidos (ex: \`GET /usuarios/me\`), o frontend deve continuar enviando o cabeçalho \`Authorization: Bearer <seu_token_jwt>\`.
  `;

  const config = new DocumentBuilder()
    .setTitle('BUFFS API')
    .setDescription(swaggerDescription)
    .setVersion('1.0')
    .addTag('Usuários', 'Gerenciamento de perfis de usuários')
    .addTag('Rebanho - Búfalos', 'Gerenciamento de búfalos individuais')
    // Adicione mais tags para suas outras entidades aqui
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Insira o token JWT obtido do Supabase após o login do usuário no cliente.',
        in: 'header',
      },
      'JWT-auth', // Este nome deve corresponder ao usado no decorator @ApiBearerAuth()
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 🌐 Configuração de CORS mais segura
  const allowedOrigins = process.env.CORS_ORIGIN ? 
    process.env.CORS_ORIGIN.split(',') : 
    ['http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requisições sem origin (como mobile apps, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Graceful shutdown para AWS App Runner
  app.enableShutdownHooks();

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 API rodando em: http://0.0.0.0:${port}`);
  console.log(`📚 Documentação Swagger: http://0.0.0.0:${port}/api`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
