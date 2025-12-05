import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { ChecklistService } from './checklist.service';
import { ChecklistBulkUpdateDto, ChecklistMensalQueryDto } from './dto/checklist.dto';

@Controller('financas/checklist')
@UseGuards(JwtAuthGuard)
export class ChecklistController {
  constructor(private readonly service: ChecklistService) {}

  @Get('mensal')
  async mensal(@Req() req, @Query() query: ChecklistMensalQueryDto) {
    return this.service.mensal(req.user.id, query.mes, query.ano);
  }

  @Patch('mensal/bulk')
  async bulk(@Req() req, @Body() body: ChecklistBulkUpdateDto) {
    return this.service.bulkUpdate(req.user.id, body.mes, body.ano, body.itens);
  }
}
