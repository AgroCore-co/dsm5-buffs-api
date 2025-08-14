import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

    app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 API rodando em: http://localhost:${port}`);
  console.log(`📚 Documentação Swagger: http://localhost:${port}/api`);
}
bootstrap();
