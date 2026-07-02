import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyEarningPlanning } from './daily-earning-planning.entity';
import { EarningPlanningController } from './earning-planning.controller';
import { EarningPlanningService } from './earning-planning.service';

@Module({
  imports: [TypeOrmModule.forFeature([DailyEarningPlanning])],
  controllers: [EarningPlanningController],
  providers: [EarningPlanningService],
})
export class EarningPlanningModule {}

