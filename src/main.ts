import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const swaggerDescription = `
  Documentação da API para o sistema de gerenciamento de búfalos (BUFFS).

  ## Autenticação

  Esta API utiliza autenticação via JWT (Bearer Token) fornecido pelo Supabase.
  Para obter um token de acesso, o cliente (frontend/mobile) deve realizar a autenticação diretamente com a API do Supabase usando o SDK apropriado.

  **Fluxo:**
  1. O usuário faz login no aplicativo cliente usando e-mail e senha.
  2. O cliente usa o SDK do Supabase para autenticar essas credenciais.
  3. Após o sucesso, o Supabase retorna um \`access_token\` (JWT).
  4. Para todas as requisições a esta API que exigem autenticação, inclua o token no cabeçalho \`Authorization\`.

  **Exemplo de Cabeçalho:**
  \`\`\`
  Authorization: Bearer <seu_token_jwt_do_supabase>
  \`\`\`
  `;

  const config = new DocumentBuilder()
    .setTitle('BUFFS API')
    .setDescription(swaggerDescription) // Usamos a nova descrição detalhada
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
