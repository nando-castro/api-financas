import { Test, TestingModule } from '@nestjs/testing';
import { FinancasService } from './financas.service';

describe('FinancasService', () => {
  let service: FinancasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinancasService],
    }).compile();

    service = module.get<FinancasService>(FinancasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
