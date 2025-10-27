import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Financa } from '../financa.entity';
import { SaldoMensal } from './saldo-mensal.entity';
import { SaldoMensalService } from './saldo-mensal.service';

@Module({
  imports: [TypeOrmModule.forFeature([SaldoMensal, Financa])],
  providers: [SaldoMensalService],
  exports: [SaldoMensalService],
})
export class SaldoMensalModule {}
