import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartaoFatura } from './cartao-fatura.entity';
import { CartaoLancamento } from './cartao-lancamento.entity';
import { Cartao } from './cartao.entity';
import { CartoesController } from './cartoes.controller';
import { CartoesService } from './cartoes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cartao, CartaoFatura, CartaoLancamento])],
  controllers: [CartoesController],
  providers: [CartoesService],
  exports: [CartoesService],
})
export class CartoesModule {}
