import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async criar(dados: Partial<Usuario>) {
    const novo = this.usuarioRepo.create(dados);
    return await this.usuarioRepo.save(novo);
  }

  async listar() {
    return await this.usuarioRepo.find();
  }

  async buscarPorEmail(email: string) {
    return await this.usuarioRepo.findOne({ where: { email } });
  }
}
