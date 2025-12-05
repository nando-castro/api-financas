import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Financa } from '../financa.entity';
import { ChecklistController } from './checklist.controller';
import { ChecklistService } from './checklist.service';
import { FinancaCheckMensal } from './financa-check-mensal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Financa, FinancaCheckMensal])],
  controllers: [ChecklistController],
  providers: [ChecklistService],
})
export class ChecklistModule {}
