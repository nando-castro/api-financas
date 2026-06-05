import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Categoria } from 'src/categorias/categoria.entity';
import { Financa } from '../financa.entity';
import { RegraPercentualController } from './regras-percentuais.controller';
import { RegraPercentual } from './regras-percentuais.entity';
import { RegraPercentualService } from './regras-percentuais.service';

@Module({
  imports: [TypeOrmModule.forFeature([RegraPercentual, Financa, Categoria])],
  controllers: [RegraPercentualController],
  providers: [RegraPercentualService],
  exports: [RegraPercentualService],
})
export class RegraPercentualModule {}
