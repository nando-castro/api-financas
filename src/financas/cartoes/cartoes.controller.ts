// src/cartoes/cartoes.controller.ts
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CartoesService } from './cartoes.service';
import { AjustarFaturaDto } from './dto/ajustar-fatura.dto';
import { AtualizarCartaoDto } from './dto/atualizar-cartao.dto';
import { CriarLancamentoCartaoDto } from './dto/criar-lancamento.dto';

@Controller('cartoes')
export class CartoesController {
  constructor(private readonly service: CartoesService) {}

  // ajuste: pegue do auth
  private usuarioId() {
    return 1;
  }

  @Get()
  listar() {
    return this.service.listar(this.usuarioId());
  }

  @Get('saldos')
  saldos(@Query('mes') mes: string, @Query('ano') ano: string) {
    return this.service.saldos(Number(mes), Number(ano), this.usuarioId());
  }

  @Get(':id/fatura')
  detalhes(@Param('id') id: string, @Query('mes') mes: string, @Query('ano') ano: string) {
    return this.service.detalhesFatura(Number(id), this.usuarioId(), Number(mes), Number(ano));
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarCartaoDto) {
    return this.service.atualizarCartao(Number(id), this.usuarioId(), dto);
  }

  @Patch(':id/fatura')
  ajustar(@Param('id') id: string, @Body() dto: AjustarFaturaDto) {
    return this.service.ajustarFatura(Number(id), this.usuarioId(), dto);
  }

  @Post(':id/lancamentos')
  lancamento(@Param('id') id: string, @Body() dto: CriarLancamentoCartaoDto) {
    return this.service.criarLancamento(Number(id), this.usuarioId(), dto);
  }
}
