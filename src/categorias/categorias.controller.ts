import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CategoriasService } from './categorias.service';
import { CriarCategoriaDto } from './dto/criar-categoria.dto';

@Controller('categorias')
@UseGuards(JwtAuthGuard)
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Post()
  async criar(@Body() dto: CriarCategoriaDto, @Req() req) {
    return this.categoriasService.criar(dto, req.user);
  }

  @Get()
  async listar(@Req() req) {
    return this.categoriasService.listar(req.user.id);
  }

  @Put(':id')
  async atualizar(@Param('id') id: number, @Body() dto: CriarCategoriaDto, @Req() req) {
    return this.categoriasService.atualizar(id, dto, req.user.id);
  }

  @Delete(':id')
  async remover(@Param('id') id: number, @Req() req) {
    return this.categoriasService.remover(id, req.user.id);
  }
}
