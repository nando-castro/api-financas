import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Categoria } from '../categorias/categoria.entity';
import { CartoesModule } from './cartoes/cartoes.module';
import { EstatisticasModule } from './estatisticas/estatisticas.module';
import { Financa } from './financa.entity';
import { FinancasController } from './financas.controller';
import { FinancasService } from './financas.service';
import { SaldoMensalModule } from './saldo-mensal/saldo-mensal.module'; // ✅ módulo já exporta o service

@Module({
  imports: [
    TypeOrmModule.forFeature([Financa, Categoria]),
    EstatisticasModule,
    SaldoMensalModule, // ✅ importa o módulo (não o service direto)
    CartoesModule,
  ],
  controllers: [FinancasController],
  providers: [FinancasService], // ✅ apenas o service principal
})
export class FinancasModule {}
