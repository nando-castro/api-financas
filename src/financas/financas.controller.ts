import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AtualizarFinancaDto } from './dto/atualizar-financa.dto';
import { CriarFinancaDto } from './dto/criar-financa.dto';
import { FinancasService } from './financas.service';
import { RelatorioFinanceiroService } from './relatorios/relatorio-financeiro.service';

@Controller('financas')
@UseGuards(JwtAuthGuard)
export class FinancasController {
  constructor(
    private readonly financasService: FinancasService,
    private readonly relatorioFinanceiroService: RelatorioFinanceiroService,
  ) {}

  @Post()
  async criar(@Body() dto: CriarFinancaDto, @Req() req) {
    return this.financasService.criar(dto, req.user);
  }

  @Get()
  async listar(@Req() req) {
    return this.financasService.listar(req.user.id);
  }

  @Put(':id')
  async atualizar(@Param('id') id: number, @Body() dto: AtualizarFinancaDto, @Req() req) {
    return this.financasService.atualizar(id, dto, req.user.id);
  }

  @Delete(':id')
  async remover(@Param('id') id: number, @Req() req) {
    return this.financasService.remover(id, req.user.id);
  }

  @Get('tipo/:tipo')
  async listarPorTipo(
    @Req() req,
    @Param('tipo') tipo: 'RENDA' | 'DESPESA',
    @Query('mes') mes?: number,
    @Query('ano') ano?: number,
    @Query('categoriaId') categoriaId?: number,
  ) {
    return this.financasService.listarPorTipo(
      req.user.id,
      tipo.toUpperCase() as 'RENDA' | 'DESPESA',
      mes ? Number(mes) : undefined,
      ano ? Number(ano) : undefined,
      categoriaId ? Number(categoriaId) : undefined,
    );
  }

  @Get('relatorio/pdf')
  async gerarRelatorioPdf(
    @Req() req,
    @Query('mes') mes: number,
    @Query('ano') ano: number,
    @Res() res: Response & { set: (arg0: string, arg1: string) => void },
  ) {
    const pdf = await this.relatorioFinanceiroService.gerarPdf(
      req.user.id,
      Number(mes),
      Number(ano),
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=relatorio-${mes}-${ano}.pdf`,
      'Content-Length': pdf.length,
    });

    res.end(pdf);
  }
}
