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

  @Get('comparativo-categorias')
  async comparativoCategorias(
    @Req() req,
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    return this.estatisticasService.comparativoCategorias(
      req.user.id,
      mes ? Number(mes) : undefined,
      ano ? Number(ano) : undefined,
    );
  }

  @Get('comparativo-salario-despesa')
  async comparativoSalarioDespesa(
    @Req() req,
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    return this.estatisticasService.comparativoSalarioDespesa(
      req.user.id,
      mes ? Number(mes) : undefined,
      ano ? Number(ano) : undefined,
    );
  }

  @Get('categorias-tipo-lancamento')
  async categoriasTipoLancamento(
    @Req() req,
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    return this.estatisticasService.categoriasTipoLancamento(
      req.user.id,
      mes ? Number(mes) : undefined,
      ano ? Number(ano) : undefined,
    );
  }
}
