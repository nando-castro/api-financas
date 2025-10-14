import { Test, TestingModule } from '@nestjs/testing';
import { EstatisticasController } from './estatisticas.controller';

describe('EstatisticasController', () => {
  let controller: EstatisticasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstatisticasController],
    }).compile();

    controller = module.get<EstatisticasController>(EstatisticasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
