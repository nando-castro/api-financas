import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post('criar')
  async criar(@Body() body: any) {
    return this.usuariosService.criar(body);
  }

  @Get()
  async listar() {
    return this.usuariosService.listar();
  }
}
