import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { Repository } from 'typeorm';
import { Categoria } from '../categorias/categoria.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { AtualizarFinancaDto } from './dto/atualizar-financa.dto';
import { CriarFinancaDto } from './dto/criar-financa.dto';
import { Financa } from './financa.entity';
import { SaldoMensalService } from './saldo-mensal/saldo-mensal.service';

@Injectable()
export class FinancasService {
  constructor(
    @InjectRepository(Financa)
    private financaRepo: Repository<Financa>,

    @InjectRepository(Categoria)
    private categoriaRepo: Repository<Categoria>,

    private saldoMensalService: SaldoMensalService,
  ) {}

  // 🔹 CRIAR FINANÇA
  async criar(dto: CriarFinancaDto, usuario: Usuario) {
    const categoria = dto.categoriaId
      ? await this.categoriaRepo.findOne({ where: { id: dto.categoriaId } })
      : null;

    if (dto.categoriaId && !categoria) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    let dataFim = dto.dataFim;
    if (dto.parcelas && dto.parcelas > 0 && !dataFim) {
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

    const saved = await this.financaRepo.save(financa);

    // ✅ Atualiza o saldo mensal após salvar
    const data = dayjs(dto.dataInicio);
    await this.saldoMensalService.atualizarSaldo(usuario.id, data.year(), data.month() + 1);

    return saved;
  }

  // 🔹 LISTAR TODAS
  async listar(usuarioId: number) {
    return await this.financaRepo.find({
      where: { usuario: { id: usuarioId } },
      order: { criadoEm: 'DESC' },
    });
  }

  // 🔹 ATUALIZAR FINANÇA
  async atualizar(id: number, dto: AtualizarFinancaDto, usuarioId: number) {
    const financa = await this.financaRepo.findOne({
      where: { id },
      relations: ['usuario', 'categoria'],
    });

    if (!financa) throw new NotFoundException('Finança não encontrada.');
    if (financa.usuario.id !== usuarioId)
      throw new ForbiddenException('Você não tem permissão para editar esta finança.');

    Object.assign(financa, dto);

    // 🔹 Conversão explícita das datas (importante!)
    if (dto.dataInicio) {
      // Evita que `YYYY-MM-DD` seja interpretado como UTC e recue um dia
      // em fusos negativos, como America/Sao_Paulo.
      financa.dataInicio = dayjs(dto.dataInicio).startOf('day').toDate();
    }
    if (dto.dataFim) {
      financa.dataFim = dayjs(dto.dataFim).startOf('day').toDate();
    }

    // 🔹 Atualiza categoria, se necessário
    if (dto.categoriaId !== undefined) {
      if (dto.categoriaId === null) {
        financa.categoria = null;
      } else {
        const categoria = await this.categoriaRepo.findOne({
          where: { id: dto.categoriaId },
        });
        if (!categoria) throw new NotFoundException('Categoria não encontrada.');
        financa.categoria = categoria;
      }
    }

    // 🔹 Recalcula dataFim se tiver parcelas
    if (dto.parcelas && !dto.dataFim) {
      financa.dataFim = dayjs(financa.dataInicio)
        .add(dto.parcelas - 1, 'month')
        .toDate();
    }

    const updated = await this.financaRepo.save(financa);

    // ✅ Agora sempre será uma data válida
    const data = dayjs(financa.dataInicio);
    await this.saldoMensalService.atualizarSaldo(usuarioId, data.year(), data.month() + 1);

    return updated;
  }

  // 🔹 REMOVER FINANÇA
  async remover(id: number, usuarioId: number) {
    const financa = await this.financaRepo.findOne({
      where: { id },
      relations: ['usuario'],
    });

    if (!financa) throw new NotFoundException('Finança não encontrada.');

    if (financa.usuario.id !== usuarioId)
      throw new ForbiddenException('Você não tem permissão para excluir esta finança.');

    await this.financaRepo.delete(id);

    // ✅ Atualiza o saldo mensal após remoção
    const data = dayjs(financa.dataInicio);
    await this.saldoMensalService.atualizarSaldo(usuarioId, data.year(), data.month() + 1);

    return { message: 'Finança removida com sucesso!' };
  }

  // 🔹 LISTAR POR TIPO (RENDA / DESPESA)
  async listarPorTipo(
    usuarioId: number,
    tipo: 'RENDA' | 'DESPESA',
    mes?: number,
    ano?: number,
    categoriaId?: number,
  ) {
    const query = this.financaRepo
      .createQueryBuilder('financa')
      .leftJoinAndSelect('financa.categoria', 'categoria')
      .where('financa.usuarioId = :usuarioId', { usuarioId })
      .andWhere('financa.tipo = :tipo', { tipo });

    if (categoriaId) query.andWhere('categoria.id = :categoriaId', { categoriaId });

    if (mes && ano) {
      const inicioMes = dayjs(`${ano}-${mes}-01`).startOf('month').toDate();
      const fimMes = dayjs(inicioMes).endOf('month').toDate();

      query.andWhere(
        `
        (
          (financa.dataInicio BETWEEN :inicioMes AND :fimMes)
          OR
          (financa.dataFim IS NOT NULL AND financa.dataFim BETWEEN :inicioMes AND :fimMes)
          OR
          (financa.dataInicio <= :inicioMes AND (financa.dataFim IS NULL OR financa.dataFim >= :fimMes))
        )
        `,
        { inicioMes, fimMes },
      );
    }

    query.orderBy('financa.criadoEm', 'DESC');

    const financas = await query.getMany();

    return financas.map((f) => ({
      id: f.id,
      nome: f.nome,
      valor: Number(f.valor),
      tipo: f.tipo,
      parcelas: f.parcelas,
      dataInicio: f.dataInicio,
      dataFim: f.dataFim,
      criadoEm: f.criadoEm,
      formaPagamento: f.formaPagamento ?? null,
      cartaoId: f.cartaoId ?? null,
      categoria: f.categoria ? { id: f.categoria.id, nome: f.categoria.nome } : null,
      tipoLancamento: f.tipoLancamento,
    }));
  }
}
