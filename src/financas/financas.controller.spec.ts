import { Test, TestingModule } from '@nestjs/testing';
import { FinancasController } from './financas.controller';

describe('FinancasController', () => {
  let controller: FinancasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinancasController],
    }).compile();

    controller = module.get<FinancasController>(FinancasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
