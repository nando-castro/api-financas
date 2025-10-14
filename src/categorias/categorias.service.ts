import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { Categoria } from './categoria.entity';
import { CriarCategoriaDto } from './dto/criar-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private categoriaRepo: Repository<Categoria>,
  ) {}

  async criar(dto: CriarCategoriaDto, usuario: Usuario) {
    const categoria = this.categoriaRepo.create({
      ...dto,
      usuario: { id: usuario.id },
    });
    return await this.categoriaRepo.save(categoria);
  }

  async listar(usuarioId: number) {
    return await this.categoriaRepo.find({
      where: { usuario: { id: usuarioId } },
      order: { criadoEm: 'DESC' },
    });
  }

  async atualizar(id: number, dto: CriarCategoriaDto, usuarioId: number) {
    const categoria = await this.categoriaRepo.findOne({
      where: { id },
      relations: ['usuario'],
    });

    if (!categoria) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    if (categoria.usuario.id !== usuarioId) {
      throw new ForbiddenException('Você não tem permissão para editar esta categoria.');
    }

    categoria.nome = dto.nome;
    return await this.categoriaRepo.save(categoria);
  }

  async remover(id: number, usuarioId: number) {
    const categoria = await this.categoriaRepo.findOne({
      where: { id },
      relations: ['usuario'],
    });

    if (!categoria) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    if (categoria.usuario.id !== usuarioId) {
      throw new ForbiddenException('Você não tem permissão para remover esta categoria.');
    }

    await this.categoriaRepo.delete(id);
    return { message: 'Categoria removida com sucesso!' };
  }
}
