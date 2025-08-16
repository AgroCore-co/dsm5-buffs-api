import { Test, TestingModule } from '@nestjs/testing';
import { ControleLeiteiroService } from './controle-leiteiro.service';

describe('ControleLeiteiroService', () => {
  let service: ControleLeiteiroService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ControleLeiteiroService],
    }).compile();

    service = module.get<ControleLeiteiroService>(ControleLeiteiroService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
