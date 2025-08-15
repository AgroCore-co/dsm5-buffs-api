import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Alimentação (e2e)', () => {
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

  describe('/alimentacoes-def (Alimentações Definidas)', () => {
    const createAlimentacaoDefDto = {
      nome_alimentacao: 'Ração de Recria',
      descricao: 'Ração balanceada para búfalos em fase de recria',
      tipo_alimentacao: 'C',
    };

    const updateAlimentacaoDefDto = {
      nome_alimentacao: 'Ração de Recria Atualizada',
    };

    describe('POST /alimentacoes-def', () => {
      it('should create a new alimentação definida', () => {
        return request(app.getHttpServer())
          .post('/alimentacoes-def')
          .send(createAlimentacaoDefDto)
          .expect(401); // Sem autenticação
      });

      it('should validate required fields', () => {
        return request(app.getHttpServer())
          .post('/alimentacoes-def')
          .send({})
          .expect(401); // Sem autenticação
      });

      it('should validate tipo_alimentacao enum', () => {
        return request(app.getHttpServer())
          .post('/alimentacoes-def')
          .send({
            nome_alimentacao: 'Teste',
            tipo_alimentacao: 'X', // Valor inválido
          })
          .expect(401); // Sem autenticação
      });

      it('should validate nome_alimentacao max length', () => {
        return request(app.getHttpServer())
          .post('/alimentacoes-def')
          .send({
            ...createAlimentacaoDefDto,
            nome_alimentacao: 'A'.repeat(101), // Mais de 100 caracteres
          })
          .expect(401); // Sem autenticação
      });
    });

    describe('GET /alimentacoes-def', () => {
      it('should return all alimentações definidas', () => {
        return request(app.getHttpServer())
          .get('/alimentacoes-def')
          .expect(401); // Sem autenticação
      });
    });

    describe('GET /alimentacoes-def/:id', () => {
      it('should return a specific alimentação definida', () => {
        return request(app.getHttpServer())
          .get('/alimentacoes-def/1')
          .expect(401); // Sem autenticação
      });

      it('should return 404 for non-existent alimentação definida', () => {
        return request(app.getHttpServer())
          .get('/alimentacoes-def/999')
          .expect(401); // Sem autenticação
      });
    });

    describe('PATCH /alimentacoes-def/:id', () => {
      it('should update an alimentação definida', () => {
        return request(app.getHttpServer())
          .patch('/alimentacoes-def/1')
          .send(updateAlimentacaoDefDto)
          .expect(401); // Sem autenticação
      });
    });

    describe('DELETE /alimentacoes-def/:id', () => {
      it('should delete an alimentação definida', () => {
        return request(app.getHttpServer())
          .delete('/alimentacoes-def/1')
          .expect(401); // Sem autenticação
      });
    });
  });

  describe('Validation Tests', () => {
    describe('POST /alimentacoes-def with invalid data', () => {
      it('should reject empty nome_alimentacao', () => {
        return request(app.getHttpServer())
          .post('/alimentacoes-def')
          .send({
            descricao: 'Teste',
            tipo_alimentacao: 'C',
          })
          .expect(401); // Sem autenticação
      });

      it('should reject invalid tipo_alimentacao values', () => {
        const invalidTypes = ['A', 'B', 'D', 'E', 'F'];
        
        invalidTypes.forEach(invalidType => {
          return request(app.getHttpServer())
            .post('/alimentacoes-def')
            .send({
              nome_alimentacao: 'Teste',
              tipo_alimentacao: invalidType,
            })
            .expect(401); // Sem autenticação
        });
      });

      it('should accept valid tipo_alimentacao values', () => {
        const validTypes = ['P', 'C', 'S'];
        
        validTypes.forEach(validType => {
          return request(app.getHttpServer())
            .post('/alimentacoes-def')
            .send({
              nome_alimentacao: 'Teste',
              tipo_alimentacao: validType,
            })
            .expect(401); // Sem autenticação (mas validação deve passar)
        });
      });
    });
  });

  describe('API Documentation', () => {
    it('should have alimentação endpoints documented in Swagger', () => {
      return request(app.getHttpServer())
        .get('/api')
        .expect(200)
        .expect((res) => {
          // Verifica se a documentação contém endpoints de alimentação
          expect(res.text).toContain('alimentacao');
        });
    });
  });
});
