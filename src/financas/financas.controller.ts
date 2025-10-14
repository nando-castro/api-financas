import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AtualizarFinancaDto } from './dto/atualizar-financa.dto';
import { CriarFinancaDto } from './dto/criar-financa.dto';
import { FinancasService } from './financas.service';

@Controller('financas')
@UseGuards(JwtAuthGuard)
export class FinancasController {
  constructor(private readonly financasService: FinancasService) {}

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
  async listarPorTipo(@Param('tipo') tipo: 'RENDA' | 'DESPESA', @Req() req) {
    return this.financasService.listarPorTipo(
      req.user.id,
      tipo.toUpperCase() as 'RENDA' | 'DESPESA',
    );
  }
}
