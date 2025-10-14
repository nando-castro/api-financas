import { Test, TestingModule } from '@nestjs/testing';
import { EstatisticasService } from './estatisticas.service';

describe('EstatisticasService', () => {
  let service: EstatisticasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EstatisticasService],
    }).compile();

    service = module.get<EstatisticasService>(EstatisticasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
