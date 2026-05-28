import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { Categoria } from './categoria.entity';
import { AtualizarCategoriaDto } from './dto/atualizar-categoria.dto';
import { CriarCategoriaDto } from './dto/criar-categoria.dto';
import { TipoCategoria } from './enums/tipo-categoria.enum';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private categoriaRepo: Repository<Categoria>,
  ) {}

  async criar(dto: CriarCategoriaDto, usuario: Usuario) {
    const nome = dto.nome.trim();

    const categoriaExistente = await this.categoriaRepo.findOne({
      where: {
        nome,
        tipo: dto.tipo,
        usuario: { id: usuario.id },
      },
    });

    if (categoriaExistente) {
      throw new BadRequestException('Já existe uma categoria com esse nome para esse tipo.');
    }

    const categoria = this.categoriaRepo.create({
      nome,
      tipo: dto.tipo,
      usuario: { id: usuario.id },
    });

    return await this.categoriaRepo.save(categoria);
  }

  async listar(usuarioId: number, tipo?: TipoCategoria) {
    const where: FindOptionsWhere<Categoria> = {
      usuario: { id: usuarioId },
    };

    if (tipo) {
      where.tipo = tipo;
    }

    return await this.categoriaRepo.find({
      where,
      order: { criadoEm: 'DESC' },
    });
  }

  async atualizar(id: number, dto: AtualizarCategoriaDto, usuarioId: number) {
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

    const novoNome = dto.nome?.trim() ?? categoria.nome;
    const novoTipo = dto.tipo ?? categoria.tipo;

    const categoriaExistente = await this.categoriaRepo.findOne({
      where: {
        nome: novoNome,
        tipo: novoTipo,
        usuario: { id: usuarioId },
      },
    });

    if (categoriaExistente && categoriaExistente.id !== categoria.id) {
      throw new BadRequestException('Já existe uma categoria com esse nome para esse tipo.');
    }

    categoria.nome = novoNome;
    categoria.tipo = novoTipo;

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
