import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { EstatisticasService } from './estatisticas.service';

@Controller('financas/estatisticas')
@UseGuards(JwtAuthGuard)
export class EstatisticasController {
  constructor(private readonly estatisticasService: EstatisticasService) {}

  @Get('mensal')
  async mensal(@Req() req, @Query('mes') mes?: number, @Query('ano') ano?: number) {
    return this.estatisticasService.estatisticasMensal(req.user.id, mes, ano);
  }

  @Get('anual')
  async anual(@Req() req, @Query('ano') ano?: number) {
    return this.estatisticasService.estatisticasAnual(req.user.id, ano);
  }

  @Get('tendencia')
  async tendencia(@Req() req) {
    return this.estatisticasService.tendencia(req.user.id);
  }

  @Get('categorias')
  async categorias(@Req() req, @Query('mes') mes?: number, @Query('ano') ano?: number) {
    return this.estatisticasService.porCategoria(req.user.id, mes, ano);
  }
}
