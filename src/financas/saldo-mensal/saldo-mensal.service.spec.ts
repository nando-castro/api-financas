import { Test, TestingModule } from '@nestjs/testing';
import { SaldoMensalService } from './saldo-mensal.service';

describe('SaldoMensalService', () => {
  let service: SaldoMensalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaldoMensalService],
    }).compile();

    service = module.get<SaldoMensalService>(SaldoMensalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
