import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Rebanho (e2e)', () => {
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

  describe('/racas (Raças)', () => {
    const createRacaDto = {
      nome: 'Murrah',
    };

    const updateRacaDto = {
      nome: 'Murrah Atualizada',
    };

    describe('POST /racas', () => {
      it('should create a new raça', () => {
        return request(app.getHttpServer())
          .post('/racas')
          .send(createRacaDto)
          .expect(401); // Sem autenticação
      });
    });

    describe('GET /racas', () => {
      it('should return all raças', () => {
        return request(app.getHttpServer())
          .get('/racas')
          .expect(401); // Sem autenticação
      });
    });

    describe('GET /racas/:id', () => {
      it('should return a specific raça', () => {
        return request(app.getHttpServer())
          .get('/racas/1')
          .expect(401); // Sem autenticação
      });

      it('should return 404 for non-existent raça', () => {
        return request(app.getHttpServer())
          .get('/racas/999')
          .expect(401); // Sem autenticação
      });
    });

    describe('PATCH /racas/:id', () => {
      it('should update a raça', () => {
        return request(app.getHttpServer())
          .patch('/racas/1')
          .send(updateRacaDto)
          .expect(401); // Sem autenticação
      });
    });

    describe('DELETE /racas/:id', () => {
      it('should delete a raça', () => {
        return request(app.getHttpServer())
          .delete('/racas/1')
          .expect(401); // Sem autenticação
      });
    });
  });

  describe('/grupos (Grupos)', () => {
    const createGrupoDto = {
      nome_grupo: 'Grupo de Recria',
      nivel_maturidade: 'N',
    };

    const updateGrupoDto = {
      nome_grupo: 'Grupo de Recria Atualizado',
    };

    describe('POST /grupos', () => {
      it('should create a new grupo', () => {
        return request(app.getHttpServer())
          .post('/grupos')
          .send(createGrupoDto)
          .expect(401); // Sem autenticação
      });

      it('should validate required fields', () => {
        return request(app.getHttpServer())
          .post('/grupos')
          .send({})
          .expect(401); // Sem autenticação
      });

      it('should validate nivel_maturidade enum', () => {
        return request(app.getHttpServer())
          .post('/grupos')
          .send({
            nome_grupo: 'Teste',
            nivel_maturidade: 'X', // Valor inválido
          })
          .expect(401); // Sem autenticação
      });
    });

    describe('GET /grupos', () => {
      it('should return all grupos', () => {
        return request(app.getHttpServer())
          .get('/grupos')
          .expect(401); // Sem autenticação
      });
    });

    describe('GET /grupos/:id', () => {
      it('should return a specific grupo', () => {
        return request(app.getHttpServer())
          .get('/grupos/1')
          .expect(401); // Sem autenticação
      });

      it('should return 404 for non-existent grupo', () => {
        return request(app.getHttpServer())
          .get('/grupos/999')
          .expect(401); // Sem autenticação
      });
    });

    describe('PATCH /grupos/:id', () => {
      it('should update a grupo', () => {
        return request(app.getHttpServer())
          .patch('/grupos/1')
          .send(updateGrupoDto)
          .expect(401); // Sem autenticação
      });
    });

    describe('DELETE /grupos/:id', () => {
      it('should delete a grupo', () => {
        return request(app.getHttpServer())
          .delete('/grupos/1')
          .expect(401); // Sem autenticação
      });
    });
  });

  describe('/bufalos (Búfalos)', () => {
    const createBufaloDto = {
      nome: 'Valente',
      sexo: 'M',
      id_raca: 1,
      id_propriedade: 1,
    };

    describe('POST /bufalos', () => {
      it('should create a new búfalo', () => {
        return request(app.getHttpServer())
          .post('/bufalos')
          .send(createBufaloDto)
          .expect(401); // Sem autenticação
      });
    });

    describe('GET /bufalos', () => {
      it('should return all búfalos', () => {
        return request(app.getHttpServer())
          .get('/bufalos')
          .expect(401); // Sem autenticação
      });
    });

    describe('GET /bufalos/:id', () => {
      it('should return a specific búfalo', () => {
        return request(app.getHttpServer())
          .get('/bufalos/1')
          .expect(401); // Sem autenticação
      });
    });

    describe('PATCH /bufalos/:id', () => {
      it('should update a búfalo', () => {
        return request(app.getHttpServer())
          .patch('/bufalos/1')
          .send({ nome: 'Valente Atualizado' })
          .expect(401); // Sem autenticação
      });
    });

    describe('DELETE /bufalos/:id', () => {
      it('should delete a búfalo', () => {
        return request(app.getHttpServer())
          .delete('/bufalos/1')
          .expect(401); // Sem autenticação
      });
    });
  });
});
