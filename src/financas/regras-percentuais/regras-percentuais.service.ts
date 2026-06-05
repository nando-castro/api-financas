import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Categoria } from 'src/categorias/categoria.entity';
import { Usuario } from 'src/usuarios/usuario.entity';
import { Repository } from 'typeorm';
import { Financa } from '../financa.entity';
import { AtualizarRegraPercentualDto } from './dto/regras-percentuais-atualizar.dto';
import { CriarRegraPercentualDto } from './dto/regras-percentuais.dto';
import { RegraPercentual } from './regras-percentuais.entity';
import { BasePercentualEnum } from './regras-percentuais.enums';

@Injectable()
export class RegraPercentualService {
  constructor(
    @InjectRepository(RegraPercentual)
    private readonly regraRepo: Repository<RegraPercentual>,

    @InjectRepository(Financa)
    private readonly financaRepo: Repository<Financa>,

    @InjectRepository(Categoria)
    private readonly categoriaRepo: Repository<Categoria>,
  ) {}

  async criar(dto: CriarRegraPercentualDto, usuario: Usuario) {
    let categoria: Categoria | null = null;

    if (dto.basePercentual === BasePercentualEnum.CATEGORIA_RENDA) {
      if (!dto.categoriaId) {
        throw new BadRequestException('Categoria obrigatória para CATEGORIA_RENDA.');
      }

      categoria = await this.categoriaRepo.findOne({
        where: { id: dto.categoriaId },
      });

      if (!categoria) {
        throw new NotFoundException('Categoria não encontrada.');
      }
    }

    const regra = this.regraRepo.create({
      nome: dto.nome,
      percentual: dto.percentual,
      basePercentual: dto.basePercentual,
      categoria,
      usuario,
      ativo: true,
    });

    return this.regraRepo.save(regra);
  }

  async listar(usuarioId: number) {
    const regras = await this.regraRepo.find({
      where: {
        usuario: {
          id: usuarioId,
        },
      },
      relations: ['categoria'],
      order: {
        id: 'DESC',
      },
    });

    const resultado: any[] = [];

    for (const regra of regras) {
      const calculo = await this.calcularValor(regra, usuarioId);

      resultado.push({
        id: regra.id,
        nome: regra.nome,
        percentual: regra.percentual,
        basePercentual: regra.basePercentual,
        categoria: regra.categoria,
        valorBase: calculo.valorBase,
        valorCalculado: calculo.valorCalculado,
      });
    }

    return resultado;
  }

  async buscarPorId(id: number, usuarioId: number) {
    const regra = await this.regraRepo.findOne({
      where: {
        id,
      },
      relations: ['usuario', 'categoria'],
    });

    if (!regra) {
      throw new NotFoundException('Regra não encontrada.');
    }

    if (regra.usuario.id !== usuarioId) {
      throw new ForbiddenException();
    }

    const calculo = await this.calcularValor(regra, usuarioId);

    return {
      ...regra,
      ...calculo,
    };
  }

  async atualizar(id: number, dto: AtualizarRegraPercentualDto, usuarioId: number) {
    const regra = await this.regraRepo.findOne({
      where: { id },
      relations: ['usuario', 'categoria'],
    });

    if (!regra) {
      throw new NotFoundException('Regra não encontrada.');
    }

    if (regra.usuario.id !== usuarioId) {
      throw new ForbiddenException();
    }

    if (dto.basePercentual === BasePercentualEnum.CATEGORIA_RENDA) {
      if (!dto.categoriaId) {
        throw new BadRequestException('Categoria obrigatória para CATEGORIA_RENDA.');
      }

      const categoria = await this.categoriaRepo.findOne({
        where: {
          id: dto.categoriaId,
        },
      });

      if (!categoria) {
        throw new NotFoundException('Categoria não encontrada.');
      }

      regra.categoria = categoria;
    }

    if (dto.basePercentual === BasePercentualEnum.TOTAL_RENDAS) {
      regra.categoria = null;
    }

    Object.assign(regra, dto);

    return this.regraRepo.save(regra);
  }

  async remover(id: number, usuarioId: number) {
    const regra = await this.regraRepo.findOne({
      where: { id },
      relations: ['usuario'],
    });

    if (!regra) {
      throw new NotFoundException('Regra não encontrada.');
    }

    if (regra.usuario.id !== usuarioId) {
      throw new ForbiddenException();
    }

    await this.regraRepo.delete(id);

    return {
      message: 'Regra removida com sucesso.',
    };
  }

  async calcular(id: number, usuarioId: number) {
    const regra = await this.regraRepo.findOne({
      where: {
        id,
      },
      relations: ['usuario', 'categoria'],
    });

    if (!regra) {
      throw new NotFoundException('Regra não encontrada.');
    }

    if (regra.usuario.id !== usuarioId) {
      throw new ForbiddenException();
    }

    const calculo = await this.calcularValor(regra, usuarioId);

    return {
      regraId: regra.id,
      nome: regra.nome,
      percentual: regra.percentual,
      basePercentual: regra.basePercentual,
      valorBase: calculo.valorBase,
      valorCalculado: calculo.valorCalculado,
    };
  }

  private async calcularValor(regra: RegraPercentual, usuarioId: number) {
    let valorBase = 0;

    if (regra.basePercentual === BasePercentualEnum.TOTAL_RENDAS) {
      const total = await this.financaRepo
        .createQueryBuilder('f')
        .leftJoin('f.usuario', 'u')
        .where('u.id = :usuarioId', { usuarioId })
        .andWhere('f.tipo = :tipo', {
          tipo: 'RENDA',
        })
        .select('COALESCE(SUM(f.valor),0)', 'total')
        .getRawOne();

      valorBase = Number(total?.total ?? 0);
    }

    if (regra.basePercentual === BasePercentualEnum.CATEGORIA_RENDA) {
      if (!regra.categoria) {
        throw new NotFoundException('Categoria da regra não encontrada.');
      }

      const total = await this.financaRepo
        .createQueryBuilder('f')
        .leftJoin('f.usuario', 'u')
        .leftJoin('f.categoria', 'c')
        .where('u.id = :usuarioId', { usuarioId })
        .andWhere('f.tipo = :tipo', {
          tipo: 'RENDA',
        })
        .andWhere('c.id = :categoriaId', {
          categoriaId: regra.categoria.id,
        })
        .select('COALESCE(SUM(f.valor),0)', 'total')
        .getRawOne();

      valorBase = Number(total?.total ?? 0);
    }

    return {
      valorBase,
      valorCalculado: Number((valorBase * (Number(regra.percentual) / 100)).toFixed(2)),
    };
  }
}
