import { Test, TestingModule } from '@nestjs/testing';
import { ControleLeiteiroController } from './controle-leiteiro.controller';

describe('ControleLeiteiroController', () => {
  let controller: ControleLeiteiroController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ControleLeiteiroController],
    }).compile();

    controller = module.get<ControleLeiteiroController>(ControleLeiteiroController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
