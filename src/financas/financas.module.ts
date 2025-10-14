import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Categoria } from '../categorias/categoria.entity';
import { Financa } from './financa.entity';
import { FinancasController } from './financas.controller';
import { FinancasService } from './financas.service';
import { EstatisticasModule } from './estatisticas/estatisticas.module';

@Module({
  imports: [TypeOrmModule.forFeature([Financa, Categoria]), EstatisticasModule],
  controllers: [FinancasController],
  providers: [FinancasService],
})
export class FinancasModule {}
