import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CartaoFatura } from './cartao-fatura.entity';
import { CartaoLancamento } from './cartao-lancamento.entity';
import { Cartao } from './cartao.entity';
import { AjustarFaturaDto } from './dto/ajustar-fatura.dto';
import { AtualizarCartaoDto } from './dto/atualizar-cartao.dto';
import { AtualizarLancamentoCartaoDto } from './dto/atualizar-lancamento.dto';
import { CriarCartaoDto } from './dto/create-cartao.dto';
import { CriarLancamentoCartaoDto } from './dto/criar-lancamento.dto';

@Injectable()
export class CartoesService {
  constructor(
    @InjectRepository(Cartao) private readonly cartoesRepo: Repository<Cartao>,
    @InjectRepository(CartaoFatura) private readonly faturasRepo: Repository<CartaoFatura>,
    @InjectRepository(CartaoLancamento) private readonly lancRepo: Repository<CartaoLancamento>,
  ) {}

  private async getCartaoOrFail(cartaoId: number, usuarioId: number) {
    const cartao = await this.cartoesRepo.findOne({ where: { id: cartaoId, usuarioId } });
    if (!cartao) throw new NotFoundException('Cartão não encontrado.');
    return cartao;
  }

  private async getOrCreateFatura(cartaoId: number, mes: number, ano: number) {
    let fatura = await this.faturasRepo.findOne({ where: { cartaoId, mes, ano } });
    if (!fatura) {
      fatura = this.faturasRepo.create({ cartaoId, mes, ano, ajusteFatura: 0, totalPago: 0 });
      fatura = await this.faturasRepo.save(fatura);
    }
    return fatura;
  }

  private async resolveLimiteVigente(
    cartao: Cartao,
    mes: number,
    ano: number,
    fatura: CartaoFatura,
  ) {
    if (fatura.limiteMes != null) return Number(fatura.limiteMes);

    const prevStrict = await this.faturasRepo
      .createQueryBuilder('f')
      .where('f.cartaoId = :cartaoId', { cartaoId: cartao.id })
      .andWhere('f.limiteMes is not null')
      .andWhere(
        new Brackets((qb) => {
          qb.where('f.ano < :ano', { ano }).orWhere('f.ano = :ano AND f.mes < :mes', { ano, mes });
        }),
      )
      .orderBy('f.ano', 'DESC')
      .addOrderBy('f.mes', 'DESC')
      .getOne();

    if (prevStrict?.limiteMes != null) return Number(prevStrict.limiteMes);
    return Number(cartao.limite || 0);
  }

  /**
   * Resume uma fatura com agregações confiáveis (não depende do cache totalPago).
   */
  private async resumoFaturaPorId(faturaId: number) {
    const row = await this.lancRepo
      .createQueryBuilder('l')
      .select([
        `COALESCE(SUM(CASE WHEN l.tipo = 'COMPRA' THEN l.valor ELSE 0 END), 0) as "totalCompras"`,
        `COALESCE(SUM(CASE WHEN l.tipo = 'PAGAMENTO' THEN l.valor ELSE 0 END), 0) as "totalPagamentos"`,
      ])
      .where('l.faturaId = :faturaId', { faturaId })
      .getRawOne<{ totalCompras: string; totalPagamentos: string }>();

    return {
      totalCompras: Number(row?.totalCompras ?? 0),
      totalPagamentos: Number(row?.totalPagamentos ?? 0),
    };
  }

  /**
   * Recalcula e sincroniza fatura.totalPago (cache) a partir dos lançamentos.
   * Isso garante consistência para editar/apagar pagamentos.
   */
  private async sincronizarTotalPago(faturaId: number) {
    const { totalPagamentos } = await this.resumoFaturaPorId(faturaId);
    await this.faturasRepo.update({ id: faturaId }, { totalPago: totalPagamentos });
    return totalPagamentos;
  }

  /**
   * Limite utilizado acumulado até (mes/ano), somando o saldo em aberto de cada fatura.
   */
  private async limiteUtilizadoAte(cartaoId: number, mes: number, ano: number) {
    // traz faturas até o período + seus totais agregados
    const rows = await this.faturasRepo
      .createQueryBuilder('f')
      .leftJoin(CartaoLancamento, 'l', 'l.faturaId = f.id')
      .select([
        'f.id as "faturaId"',
        'f.ajusteFatura as "ajusteFatura"',
        `COALESCE(SUM(CASE WHEN l.tipo = 'COMPRA' THEN l.valor ELSE 0 END), 0) as "totalCompras"`,
        `COALESCE(SUM(CASE WHEN l.tipo = 'PAGAMENTO' THEN l.valor ELSE 0 END), 0) as "totalPagamentos"`,
      ])
      .where('f.cartaoId = :cartaoId', { cartaoId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('f.ano < :ano', { ano }).orWhere('f.ano = :ano AND f.mes <= :mes', { ano, mes });
        }),
      )
      .groupBy('f.id')
      .addGroupBy('f.ajusteFatura')
      .getRawMany<{
        faturaId: number;
        ajusteFatura: string | number;
        totalCompras: string;
        totalPagamentos: string;
      }>();

    let total = 0;
    for (const r of rows) {
      const valorFatura = Number(r.totalCompras ?? 0) + Number(r.ajusteFatura ?? 0);
      const pago = Number(r.totalPagamentos ?? 0);
      const emAberto = Math.max(0, valorFatura - pago);
      total += emAberto;
    }
    return total;
  }

  async atualizarCartao(cartaoId: number, usuarioId: number, dto: AtualizarCartaoDto) {
    const cartao = await this.getCartaoOrFail(cartaoId, usuarioId);
    Object.assign(cartao, dto);
    return this.cartoesRepo.save(cartao);
  }

  async ajustarFatura(cartaoId: number, usuarioId: number, dto: AjustarFaturaDto) {
    await this.getCartaoOrFail(cartaoId, usuarioId);
    const fatura = await this.getOrCreateFatura(cartaoId, dto.mes, dto.ano);

    if (dto.limiteMes != null) fatura.limiteMes = dto.limiteMes;
    if (dto.ajusteFatura != null) fatura.ajusteFatura = dto.ajusteFatura;

    const saved = await this.faturasRepo.save(fatura);

    // mantém o cache coerente após ajuste (não obrigatório, mas bom)
    await this.sincronizarTotalPago(saved.id);

    return saved;
  }

  async criarLancamento(cartaoId: number, usuarioId: number, dto: CriarLancamentoCartaoDto) {
    await this.getCartaoOrFail(cartaoId, usuarioId);
    const fatura = await this.getOrCreateFatura(cartaoId, dto.mes, dto.ano);

    const lanc = this.lancRepo.create({
      faturaId: fatura.id,
      tipo: dto.tipo,
      descricao: dto.descricao ?? null,
      data: dto.data as any,
      valor: dto.valor,
    });

    const saved = await this.lancRepo.save(lanc);

    // IMPORTANTE: não incrementa totalPago “na mão”; sempre soma e sincroniza
    await this.sincronizarTotalPago(fatura.id);

    return saved;
  }

  async editarLancamento(
    cartaoId: number,
    usuarioId: number,
    lancamentoId: number,
    dto: AtualizarLancamentoCartaoDto,
  ) {
    await this.getCartaoOrFail(cartaoId, usuarioId);

    const lanc = await this.lancRepo.findOne({
      where: { id: lancamentoId },
      relations: { fatura: true },
    });
    if (!lanc) throw new NotFoundException('Lançamento não encontrado.');

    // garante que o lançamento pertence ao cartão (via fatura)
    if (!lanc.fatura || lanc.fatura.cartaoId !== cartaoId) {
      throw new NotFoundException('Lançamento não encontrado para este cartão.');
    }

    const faturaId = lanc.faturaId;

    if (dto.tipo !== undefined) lanc.tipo = dto.tipo;
    if (dto.descricao !== undefined) lanc.descricao = dto.descricao;
    if (dto.data !== undefined) lanc.data = dto.data as any;
    if (dto.valor !== undefined) lanc.valor = dto.valor;

    const saved = await this.lancRepo.save(lanc);

    await this.sincronizarTotalPago(faturaId);

    return saved;
  }

  async apagarLancamento(cartaoId: number, usuarioId: number, lancamentoId: number) {
    await this.getCartaoOrFail(cartaoId, usuarioId);

    const lanc = await this.lancRepo.findOne({
      where: { id: lancamentoId },
      relations: { fatura: true },
    });
    if (!lanc) throw new NotFoundException('Lançamento não encontrado.');

    if (!lanc.fatura || lanc.fatura.cartaoId !== cartaoId) {
      throw new NotFoundException('Lançamento não encontrado para este cartão.');
    }

    const faturaId = lanc.faturaId;

    await this.lancRepo.delete({ id: lancamentoId });

    await this.sincronizarTotalPago(faturaId);

    return { ok: true };
  }

  async detalhesFatura(cartaoId: number, usuarioId: number, mes: number, ano: number) {
    const cartao = await this.getCartaoOrFail(cartaoId, usuarioId);
    const fatura = await this.getOrCreateFatura(cartaoId, mes, ano);

    const lancamentos = await this.lancRepo.find({
      where: { faturaId: fatura.id },
      order: { data: 'DESC', id: 'DESC' },
    });

    // totais confiáveis
    const { totalCompras, totalPagamentos } = await this.resumoFaturaPorId(fatura.id);

    const ajusteFatura = Number(fatura.ajusteFatura || 0);
    const valorFatura = totalCompras + ajusteFatura;
    const emAberto = Math.max(0, valorFatura - totalPagamentos);

    // “comunicação”: soma do aberto acumulado até este mês/ano
    const limiteUtilizado = await this.limiteUtilizadoAte(cartaoId, mes, ano);

    const limiteVigente = await this.resolveLimiteVigente(cartao, mes, ano, fatura);
    const limiteDisponivel = Math.max(0, limiteVigente - limiteUtilizado);

    // opcional: coerência do cache
    // (mantém totalPago em linha com os lançamentos)
    if (Number(fatura.totalPago || 0) !== totalPagamentos) {
      await this.faturasRepo.update({ id: fatura.id }, { totalPago: totalPagamentos });
    }

    return {
      cartao: {
        id: cartao.id,
        nome: cartao.nome,
        limiteBase: Number(cartao.limite || 0),
        diaFechamento: cartao.diaFechamento ?? null,
        diaVencimento: cartao.diaVencimento ?? null,
      },
      fatura: {
        id: fatura.id,
        mes,
        ano,
        limiteMes: fatura.limiteMes ?? null,
        ajusteFatura,
        totalCompras,
        valorFatura, // “Fatura atual” (total do mês)
        totalPago: totalPagamentos, // “Valor pago”
        emAberto, // saldo do mês
        limiteVigente,
        limiteUtilizado, // acumulado (faturas conversando)
        limiteDisponivel, // limiteVigente - limiteUtilizado
      },
      lancamentos,
    };
  }

  async saldos(mes: number, ano: number, usuarioId: number) {
    const cartoes = await this.cartoesRepo.find({ where: { usuarioId }, order: { id: 'DESC' } });

    const result: Array<{
      cartaoId: number;
      nome: string;
      limite: number;
      limiteUtilizado: number;
      limiteDisponivel: number;
      faturaAtual: number;
      emAbertoMes: number;
      mes: number;
      ano: number;
    }> = [];

    for (const c of cartoes) {
      const det = await this.detalhesFatura(c.id, usuarioId, mes, ano);

      result.push({
        cartaoId: c.id,
        nome: c.nome,
        limite: det.fatura.limiteVigente,
        limiteUtilizado: det.fatura.limiteUtilizado,
        limiteDisponivel: det.fatura.limiteDisponivel,
        faturaAtual: det.fatura.valorFatura,
        emAbertoMes: det.fatura.emAberto,
        mes,
        ano,
      });
    }

    return result;
  }

  async listar(usuarioId: number) {
    return this.cartoesRepo.find({ where: { usuarioId }, order: { id: 'DESC' } });
  }

  async criarCartao(usuarioId: number, dto: CriarCartaoDto) {
    const cartao = this.cartoesRepo.create({
      usuarioId,
      nome: dto.nome.trim(),
      limite: Number(dto.limite || 0),
      diaFechamento: dto.diaFechamento ?? null,
      diaVencimento: dto.diaVencimento ?? null,
    });

    return this.cartoesRepo.save(cartao);
  }
}
