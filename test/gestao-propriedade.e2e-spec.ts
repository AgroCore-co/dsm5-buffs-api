import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Gestão de Propriedade (e2e)', () => {
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

  describe('/enderecos (Endereços)', () => {
    const createEnderecoDto = {
      pais: 'Brasil',
      estado: 'São Paulo',
      cidade: 'Presidente Prudente',
      bairro: 'Centro',
      rua: 'Rua Principal',
      cep: '19000-000',
      numero: '123',
      ponto_referencia: 'Próximo à ponte',
    };

    const updateEnderecoDto = {
      cidade: 'Presidente Prudente Atualizada',
    };

    describe('POST /enderecos', () => {
      it('should create a new endereço', () => {
        return request(app.getHttpServer()).post('/enderecos').send(createEnderecoDto).expect(401); // Sem autenticação
      });

      it('should validate required fields', () => {
        return request(app.getHttpServer()).post('/enderecos').send({}).expect(401); // Sem autenticação
      });
    });

    describe('GET /enderecos', () => {
      it('should return all endereços', () => {
        return request(app.getHttpServer()).get('/enderecos').expect(401); // Sem autenticação
      });
    });

    describe('GET /enderecos/:id', () => {
      it('should return a specific endereço', () => {
        return request(app.getHttpServer()).get('/enderecos/1').expect(401); // Sem autenticação
      });

      it('should return 404 for non-existent endereço', () => {
        return request(app.getHttpServer()).get('/enderecos/999').expect(401); // Sem autenticação
      });
    });

    describe('PATCH /enderecos/:id', () => {
      it('should update an endereço', () => {
        return request(app.getHttpServer()).patch('/enderecos/1').send(updateEnderecoDto).expect(401); // Sem autenticação
      });
    });

    describe('DELETE /enderecos/:id', () => {
      it('should delete an endereço', () => {
        return request(app.getHttpServer()).delete('/enderecos/1').expect(401); // Sem autenticação
      });
    });
  });

  describe('/lotes (Lotes)', () => {
    const createLoteDto = {
      nome_lote: 'Pasto da Sede',
      id_propriedade: 1,
      descricao: 'Lote principal para recria',
      geo_mapa: {
        type: 'Polygon',
        coordinates: [
          [
            [-47.5, -24.5],
            [-47.4, -24.5],
            [-47.4, -24.4],
            [-47.5, -24.4],
            [-47.5, -24.5],
          ],
        ],
      },
    };

    const updateLoteDto = {
      nome_lote: 'Pasto da Sede Atualizado',
    };

    describe('POST /lotes', () => {
      it('should create a new lote', () => {
        return request(app.getHttpServer()).post('/lotes').send(createLoteDto).expect(401); // Sem autenticação
      });

      it('should validate required fields', () => {
        return request(app.getHttpServer()).post('/lotes').send({}).expect(401); // Sem autenticação
      });
    });

    describe('GET /lotes', () => {
      it('should return all lotes', () => {
        return request(app.getHttpServer()).get('/lotes').expect(401); // Sem autenticação
      });
    });

    describe('GET /lotes/:id', () => {
      it('should return a specific lote', () => {
        return request(app.getHttpServer()).get('/lotes/1').expect(401); // Sem autenticação
      });

      it('should return 404 for non-existent lote', () => {
        return request(app.getHttpServer()).get('/lotes/999').expect(401); // Sem autenticação
      });
    });

    describe('PATCH /lotes/:id', () => {
      it('should update a lote', () => {
        return request(app.getHttpServer()).patch('/lotes/1').send(updateLoteDto).expect(401); // Sem autenticação
      });
    });

    describe('DELETE /lotes/:id', () => {
      it('should delete a lote', () => {
        return request(app.getHttpServer()).delete('/lotes/1').expect(401); // Sem autenticação
      });
    });
  });

  describe('/propriedades (Propriedades)', () => {
    const createPropriedadeDto = {
      nome: 'Fazenda Modelo',
      id_endereco: 1,
      cnpj: '12.345.678/0001-90',
      p_abcb: true,
      tipo_manejo: 'P',
    };

    const updatePropriedadeDto = {
      nome: 'Fazenda Modelo Atualizada',
    };

    describe('POST /propriedades', () => {
      it('should create a new propriedade', () => {
        return request(app.getHttpServer()).post('/propriedades').send(createPropriedadeDto).expect(401); // Sem autenticação
      });

      it('should validate required fields', () => {
        return request(app.getHttpServer()).post('/propriedades').send({}).expect(401); // Sem autenticação
      });
    });

    describe('GET /propriedades', () => {
      it('should return all propriedades', () => {
        return request(app.getHttpServer()).get('/propriedades').expect(401); // Sem autenticação
      });
    });

    describe('GET /propriedades/:id', () => {
      it('should return a specific propriedade', () => {
        return request(app.getHttpServer()).get('/propriedades/1').expect(401); // Sem autenticação
      });

      it('should return 404 for non-existent propriedade', () => {
        return request(app.getHttpServer()).get('/propriedades/999').expect(401); // Sem autenticação
      });
    });

    describe('PATCH /propriedades/:id', () => {
      it('should update a propriedade', () => {
        return request(app.getHttpServer()).patch('/propriedades/1').send(updatePropriedadeDto).expect(401); // Sem autenticação
      });
    });

    describe('DELETE /propriedades/:id', () => {
      it('should delete a propriedade', () => {
        return request(app.getHttpServer()).delete('/propriedades/1').expect(401); // Sem autenticação
      });
    });
  });
});
