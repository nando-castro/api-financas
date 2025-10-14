import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Financa } from '../financa.entity';
import { EstatisticasController } from './estatisticas.controller';
import { EstatisticasService } from './estatisticas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Financa])],
  controllers: [EstatisticasController],
  providers: [EstatisticasService],
})
export class EstatisticasModule {}
