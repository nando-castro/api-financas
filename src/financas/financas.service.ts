import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { Repository } from 'typeorm';
import { Categoria } from '../categorias/categoria.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { AtualizarFinancaDto } from './dto/atualizar-financa.dto';
import { CriarFinancaDto } from './dto/criar-financa.dto';
import { Financa } from './financa.entity';

@Injectable()
export class FinancasService {
  constructor(
    @InjectRepository(Financa)
    private financaRepo: Repository<Financa>,
    @InjectRepository(Categoria)
    private categoriaRepo: Repository<Categoria>,
  ) {}

  async criar(dto: CriarFinancaDto, usuario: Usuario) {
    const categoria = dto.categoriaId
      ? await this.categoriaRepo.findOne({ where: { id: dto.categoriaId } })
      : null;

    if (dto.categoriaId && !categoria) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    let dataFim = dto.dataFim;
    if (dto.parcelas && dto.parcelas > 0 && !dataFim) {
      // calcula dataFim automaticamente com base nas parcelas
      dataFim = dayjs(dto.dataInicio)
        .add(dto.parcelas - 1, 'month')
        .toDate();
    }

    const financa = this.financaRepo.create({
      ...dto,
      dataFim,
      categoria,
      usuario: { id: usuario.id },
    });

    return await this.financaRepo.save(financa);
  }

  async listar(usuarioId: number) {
    return await this.financaRepo.find({
      where: { usuario: { id: usuarioId } },
      order: { criadoEm: 'DESC' },
    });
  }

  async atualizar(id: number, dto: AtualizarFinancaDto, usuarioId: number) {
    const financa = await this.financaRepo.findOne({
      where: { id },
      relations: ['usuario'],
    });

    if (!financa) {
      throw new NotFoundException('Finança não encontrada.');
    }

    if (financa.usuario.id !== usuarioId) {
      throw new ForbiddenException('Você não tem permissão para editar esta finança.');
    }

    Object.assign(financa, dto);

    // recalcula dataFim se houver mudança de parcelas
    if (dto.parcelas && !dto.dataFim) {
      financa.dataFim = dayjs(financa.dataInicio)
        .add(dto.parcelas - 1, 'month')
        .toDate();
    }

    return await this.financaRepo.save(financa);
  }

  async remover(id: number, usuarioId: number) {
    const financa = await this.financaRepo.findOne({
      where: { id },
      relations: ['usuario'],
    });

    if (!financa) {
      throw new NotFoundException('Finança não encontrada.');
    }

    if (financa.usuario.id !== usuarioId) {
      throw new ForbiddenException('Você não tem permissão para excluir esta finança.');
    }

    await this.financaRepo.delete(id);
    return { message: 'Finança removida com sucesso!' };
  }
}
