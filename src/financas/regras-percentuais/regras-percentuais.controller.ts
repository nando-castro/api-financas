import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { AtualizarRegraPercentualDto } from './dto/regras-percentuais-atualizar.dto';
import { CriarRegraPercentualDto } from './dto/regras-percentuais.dto';
import { RegraPercentualService } from './regras-percentuais.service';

@Controller('regras-percentuais')
@UseGuards(JwtAuthGuard)
export class RegraPercentualController {
  constructor(private readonly regraPercentualService: RegraPercentualService) {}

  @Post()
  criar(@Body() dto: CriarRegraPercentualDto, @Req() req) {
    return this.regraPercentualService.criar(dto, req.user);
  }

  @Get()
  listar(@Req() req) {
    return this.regraPercentualService.listar(req.user.id);
  }

  @Get(':id')
  buscarPorId(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.regraPercentualService.buscarPorId(id, req.user.id);
  }

  @Get(':id/calcular')
  calcular(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.regraPercentualService.calcular(id, req.user.id);
  }

  @Put(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarRegraPercentualDto,
    @Req() req,
  ) {
    return this.regraPercentualService.atualizar(id, dto, req.user.id);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.regraPercentualService.remover(id, req.user.id);
  }
}
