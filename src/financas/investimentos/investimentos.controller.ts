import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { AlterarAporteDto } from './dto/alterar-aporte.dto';
import { CreateInvestimentoDto } from './dto/create-investimento.dto';
import { PararAporteDto } from './dto/parar-aporte.dto';
import { ResumoQueryDto } from './dto/resumo-query.dto';
import { UpdateInvestimentoDto } from './dto/update-investimento.dto';
import { InvestimentosService } from './investimentos.service';

@Controller('investimentos')
@UseGuards(JwtAuthGuard)
export class InvestimentosController {
  constructor(private readonly investimentosService: InvestimentosService) {}

  @Post()
  async create(@Body() dto: CreateInvestimentoDto, @Req() req) {
    return this.investimentosService.create(dto, req.user.id);
  }

  @Get()
  async findAll(@Req() req) {
    return this.investimentosService.findAll(req.user.id);
  }

  @Get('resumo')
  async resumo(@Req() req, @Query() query: ResumoQueryDto) {
    return this.investimentosService.resumoPorPeriodo(req.user.id, query.mes, query.ano);
  }

  @Get(':id/simulacao')
  async simulacao(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ResumoQueryDto,
  ) {
    return this.investimentosService.simulacaoDetalhada(id, query.mes, query.ano, req.user.id);
  }

  @Get(':id/aportes')
  async listarAportes(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.investimentosService.listarAportes(id, req.user.id);
  }

  @Patch(':id/aporte')
  async alterarAporte(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AlterarAporteDto,
    @Req() req,
  ) {
    return this.investimentosService.alterarAporte(id, dto, req.user.id);
  }

  @Patch(':id/aporte/parar')
  async pararAporte(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PararAporteDto,
    @Req() req,
  ) {
    return this.investimentosService.pararAporte(id, dto.dataParada, req.user.id);
  }

  @Delete(':id/aportes/:aporteId')
  async removerAporteProgramado(
    @Param('id', ParseIntPipe) id: number,
    @Param('aporteId', ParseIntPipe) aporteId: number,
    @Req() req,
  ) {
    return this.investimentosService.removerAporteProgramado(id, aporteId, req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.investimentosService.findOne(id, req.user.id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInvestimentoDto,
    @Req() req,
  ) {
    return this.investimentosService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.investimentosService.remove(id, req.user.id);
  }
}
