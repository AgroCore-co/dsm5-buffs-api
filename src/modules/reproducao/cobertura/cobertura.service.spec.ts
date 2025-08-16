import { Test, TestingModule } from '@nestjs/testing';
import { CoberturaService } from './cobertura.service';

describe('CoberturaService', () => {
  let service: CoberturaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoberturaService],
    }).compile();

    service = module.get<CoberturaService>(CoberturaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
