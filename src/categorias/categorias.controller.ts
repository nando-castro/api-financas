import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CategoriasService } from './categorias.service';
import { AtualizarCategoriaDto } from './dto/atualizar-categoria.dto';
import { CriarCategoriaDto } from './dto/criar-categoria.dto';
import { ListarCategoriasDto } from './dto/listar-categorias.dto';

@Controller('categorias')
@UseGuards(JwtAuthGuard)
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Post()
  async criar(@Body() dto: CriarCategoriaDto, @Req() req) {
    return this.categoriasService.criar(dto, req.user);
  }

  @Get()
  async listar(@Query() query: ListarCategoriasDto, @Req() req) {
    return this.categoriasService.listar(req.user.id, query.tipo);
  }

  @Put(':id')
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarCategoriaDto,
    @Req() req,
  ) {
    return this.categoriasService.atualizar(id, dto, req.user.id);
  }

  @Delete(':id')
  async remover(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.categoriasService.remover(id, req.user.id);
  }
}
