import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { CartoesService } from './cartoes.service';
import { AjustarFaturaDto } from './dto/ajustar-fatura.dto';
import { AtualizarCartaoDto } from './dto/atualizar-cartao.dto';
import { AtualizarLancamentoCartaoDto } from './dto/atualizar-lancamento.dto';
import { CriarCartaoDto } from './dto/create-cartao.dto';
import { CriarLancamentoCartaoDto } from './dto/criar-lancamento.dto';

@UseGuards(JwtAuthGuard)
@Controller('cartoes')
export class CartoesController {
  constructor(private readonly service: CartoesService) {}

  private usuarioId(req: Request) {
    return (req as any).user.id as number;
  }

  @Get()
  listar(@Req() req: Request) {
    return this.service.listar(this.usuarioId(req));
  }

  @Post()
  criar(@Req() req: Request, @Body() dto: CriarCartaoDto) {
    return this.service.criarCartao(this.usuarioId(req), dto);
  }

  @Get('saldos')
  saldos(@Req() req: Request, @Query('mes') mes: string, @Query('ano') ano: string) {
    return this.service.saldos(Number(mes), Number(ano), this.usuarioId(req));
  }

  @Get(':id/fatura')
  detalhes(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('mes') mes: string,
    @Query('ano') ano: string,
  ) {
    return this.service.detalhesFatura(Number(id), this.usuarioId(req), Number(mes), Number(ano));
  }

  @Patch(':id')
  atualizar(@Req() req: Request, @Param('id') id: string, @Body() dto: AtualizarCartaoDto) {
    return this.service.atualizarCartao(Number(id), this.usuarioId(req), dto);
  }

  @Patch(':id/fatura')
  ajustar(@Req() req: Request, @Param('id') id: string, @Body() dto: AjustarFaturaDto) {
    return this.service.ajustarFatura(Number(id), this.usuarioId(req), dto);
  }

  @Post(':id/lancamentos')
  lancamento(@Req() req: Request, @Param('id') id: string, @Body() dto: CriarLancamentoCartaoDto) {
    return this.service.criarLancamento(Number(id), this.usuarioId(req), dto);
  }

  @Patch(':id/lancamentos/:lancamentoId')
  editarLancamento(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('lancamentoId') lancamentoId: string,
    @Body() dto: AtualizarLancamentoCartaoDto,
  ) {
    return this.service.editarLancamento(
      Number(id),
      this.usuarioId(req),
      Number(lancamentoId),
      dto,
    );
  }

  @Delete(':id/lancamentos/:lancamentoId')
  apagarLancamento(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('lancamentoId') lancamentoId: string,
  ) {
    return this.service.apagarLancamento(Number(id), this.usuarioId(req), Number(lancamentoId));
  }
}
