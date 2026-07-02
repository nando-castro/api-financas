import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { EarningPlanningMonthQueryDto, UpdateDailyEarningPlanningDto, UpsertMonthlyEarningPlanningDto } from './dto/earning-planning.dto';
import { EarningPlanningService } from './earning-planning.service';

@Controller('earning-planning')
@UseGuards(JwtAuthGuard)
export class EarningPlanningController {
  constructor(private readonly service: EarningPlanningService) {}

  @Get('month')
  getMonth(@Req() req, @Query() query: EarningPlanningMonthQueryDto) {
    return this.service.getMonth(req.user.id, query.year, query.month);
  }

  @Post('month')
  upsertMonth(@Req() req, @Body() body: UpsertMonthlyEarningPlanningDto) {
    return this.service.upsertMonth(req.user.id, body);
  }

  @Patch('day/:id')
  updateDay(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() body: UpdateDailyEarningPlanningDto) {
    return this.service.updateDay(req.user.id, id, body);
  }

  @Delete('month')
  deleteMonth(@Req() req, @Query() query: EarningPlanningMonthQueryDto) {
    return this.service.deleteMonth(req.user.id, query.year, query.month);
  }
}

