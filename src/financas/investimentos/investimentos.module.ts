import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvestimentoAporte } from './investimento-aporte.entity';
import { Investimento } from './investimento.entity';
import { InvestimentosController } from './investimentos.controller';
import { InvestimentosService } from './investimentos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Investimento, InvestimentoAporte])],
  controllers: [InvestimentosController],
  providers: [InvestimentosService],
  exports: [InvestimentosService],
})
export class InvestimentosModule {}
