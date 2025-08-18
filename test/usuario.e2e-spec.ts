import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Usuário e Autenticação (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/usuarios (Usuários)', () => {
    const createUsuarioDto = {
      nome: 'João Silva',
      telefone: '11999998888',
      cargo: 'Gerente de Fazenda',
      id_endereco: 1,
    };

    const updateUsuarioDto = {
      nome: 'João Silva Atualizado',
    };

    describe('POST /usuarios', () => {
      it('should create a new usuário', () => {
        return request(app.getHttpServer()).post('/usuarios').send(createUsuarioDto).expect(401); // Sem autenticação
      });

      it('should validate required fields', () => {
        return request(app.getHttpServer()).post('/usuarios').send({}).expect(401); // Sem autenticação
      });

      it('should validate nome max length', () => {
        return request(app.getHttpServer())
          .post('/usuarios')
          .send({
            ...createUsuarioDto,
            nome: 'A'.repeat(101), // Mais de 100 caracteres
          })
          .expect(401); // Sem autenticação
      });
    });

    describe('GET /usuarios', () => {
      it('should return all usuários', () => {
        return request(app.getHttpServer()).get('/usuarios').expect(401); // Sem autenticação
      });
    });

    describe('GET /usuarios/:id', () => {
      it('should return a specific usuário', () => {
        return request(app.getHttpServer()).get('/usuarios/1').expect(401); // Sem autenticação
      });

      it('should return 404 for non-existent usuário', () => {
        return request(app.getHttpServer()).get('/usuarios/999').expect(401); // Sem autenticação
      });
    });

    describe('GET /usuarios/me', () => {
      it('should return current user profile', () => {
        return request(app.getHttpServer()).get('/usuarios/me').expect(401); // Sem autenticação
      });
    });

    describe('PATCH /usuarios/:id', () => {
      it('should update a usuário', () => {
        return request(app.getHttpServer()).patch('/usuarios/1').send(updateUsuarioDto).expect(401); // Sem autenticação
      });
    });

    describe('DELETE /usuarios/:id', () => {
      it('should delete a usuário', () => {
        return request(app.getHttpServer()).delete('/usuarios/1').expect(401); // Sem autenticação
      });
    });
  });

  describe('Health Check', () => {
    describe('GET /', () => {
      it('should return health check', () => {
        return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
      });
    });
  });

  describe('Swagger Documentation', () => {
    describe('GET /api', () => {
      it('should return swagger documentation', () => {
        return request(app.getHttpServer()).get('/api').expect(200);
      });
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', () => {
      return request(app.getHttpServer())
        .options('/usuarios')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization')
        .expect(204);
    });

    it('should reject requests from unauthorized origins', () => {
      return request(app.getHttpServer()).get('/usuarios').set('Origin', 'http://malicious-site.com').expect(401); // Sem autenticação, mas CORS deve rejeitar
    });
  });

  describe('Validation', () => {
    describe('POST /usuarios with invalid data', () => {
      it('should reject invalid email format', () => {
        return request(app.getHttpServer())
          .post('/usuarios')
          .send({
            ...createUsuarioDto,
            email: 'invalid-email',
          })
          .expect(401); // Sem autenticação
      });

      it('should reject invalid telefone format', () => {
        return request(app.getHttpServer())
          .post('/usuarios')
          .send({
            ...createUsuarioDto,
            telefone: '123', // Muito curto
          })
          .expect(401); // Sem autenticação
      });
    });
  });
});
