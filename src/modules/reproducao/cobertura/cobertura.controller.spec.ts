import { Test, TestingModule } from '@nestjs/testing';
import { CoberturaController } from './cobertura.controller';

describe('CoberturaController', () => {
  let controller: CoberturaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoberturaController],
    }).compile();

    controller = module.get<CoberturaController>(CoberturaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
