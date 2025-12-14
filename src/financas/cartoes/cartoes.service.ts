// cartoes.service.ts (AJUSTE: limiteDisponivel deve considerar TODAS as compras em aberto,
// inclusive meses futuros — ou seja, o "limite utilizado (acumulado)" é global do cartão)

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  private lastDayOfMonthUTC(year: number, month1to12: number) {
    // month1to12: 1..12
    return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
  }

  private makeDateUTC(year: number, month1to12: number, day1to31: number) {
    const max = this.lastDayOfMonthUTC(year, month1to12);
    const day = Math.min(Math.max(1, day1to31), max);
    return new Date(Date.UTC(year, month1to12 - 1, day, 0, 0, 0));
  }

  private addMonths(year: number, month1to12: number, delta: number) {
    const d = new Date(Date.UTC(year, month1to12 - 1 + delta, 1, 0, 0, 0));
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
  }

  /**
   * Calcula a COMPETÊNCIA (fatura mes/ano) de uma COMPRA com base no fechamento.
   * Regra:
   * - se diaCompra <= diaFechamento => fatura = mês/ano da compra
   * - senão => fatura = próximo mês
   * E a data que será salva no lançamento = diaVencimento dessa fatura (clamp no último dia do mês).
   */
  private calcularCompetenciaCompra(cartao: Cartao, compraDate: Date) {
    const diaFechamento = cartao.diaFechamento ?? null;
    const diaVencimento = cartao.diaVencimento ?? null;

    // Se não tiver configuração, cai no comportamento antigo (competência pela própria data)
    if (!diaFechamento || !diaVencimento) {
      const mes = compraDate.getUTCMonth() + 1;
      const ano = compraDate.getUTCFullYear();
      return {
        mesFatura: mes,
        anoFatura: ano,
        dataCompetencia: compraDate, // mantém a data como veio
      };
    }

    const diaCompra = compraDate.getUTCDate();
    const mesCompra = compraDate.getUTCMonth() + 1;
    const anoCompra = compraDate.getUTCFullYear();

    const ref =
      diaCompra <= diaFechamento
        ? { year: anoCompra, month: mesCompra }
        : this.addMonths(anoCompra, mesCompra, 1);

    const dataCompetencia = this.makeDateUTC(ref.year, ref.month, diaVencimento);

    return {
      mesFatura: ref.month,
      anoFatura: ref.year,
      dataCompetencia,
    };
  }

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

  private parseDateOrThrow(input: any) {
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) throw new BadRequestException('Data inválida.');
    return d;
  }

  private rangeMesUTC(ano: number, mes: number) {
    const start = new Date(Date.UTC(ano, mes - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(ano, mes, 1, 0, 0, 0));
    return { start, end };
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
   * Resume uma fatura por faturaId (mantido para sincronizar cache totalPago)
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

  private async sincronizarTotalPago(faturaId: number) {
    const { totalPagamentos } = await this.resumoFaturaPorId(faturaId);
    await this.faturasRepo.update({ id: faturaId }, { totalPago: totalPagamentos });
    return totalPagamentos;
  }

  /**
   * Totais do mês pela DATA (para lista/totais do mês, consistente com a UI)
   */
  private async resumoMesPorData(cartaoId: number, mes: number, ano: number) {
    const { start, end } = this.rangeMesUTC(ano, mes);

    const row = await this.lancRepo
      .createQueryBuilder('l')
      .innerJoin(CartaoFatura, 'f', 'f.id = l.faturaId')
      .select([
        `COALESCE(SUM(CASE WHEN l.tipo = 'COMPRA' THEN l.valor ELSE 0 END), 0) as "totalCompras"`,
        `COALESCE(SUM(CASE WHEN l.tipo = 'PAGAMENTO' THEN l.valor ELSE 0 END), 0) as "totalPagamentos"`,
      ])
      .where('f.cartaoId = :cartaoId', { cartaoId })
      .andWhere('l.data >= :start AND l.data < :end', { start, end })
      .getRawOne<{ totalCompras: string; totalPagamentos: string }>();

    return {
      totalCompras: Number(row?.totalCompras ?? 0),
      totalPagamentos: Number(row?.totalPagamentos ?? 0),
    };
  }

  /**
   * ✅ NOVO: Limite utilizado GLOBAL (todas as faturas do cartão),
   * somando o "em aberto" de cada fatura.
   *
   * Isso faz com que em DEZ/2025 o disponível já considere compras em JAN/FEV (parcelas futuras).
   */
  private async limiteUtilizadoTotal(cartaoId: number) {
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
    await this.sincronizarTotalPago(saved.id);

    return saved;
  }

  async criarLancamento(cartaoId: number, usuarioId: number, dto: CriarLancamentoCartaoDto) {
    const cartao = await this.getCartaoOrFail(cartaoId, usuarioId);

    const d = new Date(dto.data as any);
    if (Number.isNaN(d.getTime())) throw new BadRequestException('Data inválida.');

    // ✅ COMPRA: competência definida pelo fechamento + data salva vira o vencimento da fatura
    if (dto.tipo === 'COMPRA') {
      const { mesFatura, anoFatura, dataCompetencia } = this.calcularCompetenciaCompra(cartao, d);
      const fatura = await this.getOrCreateFatura(cartaoId, mesFatura, anoFatura);

      const lanc = this.lancRepo.create({
        faturaId: fatura.id,
        tipo: 'COMPRA',
        descricao: dto.descricao ?? null,
        data: dataCompetencia as any, // ✅ salva no vencimento
        valor: dto.valor,
      });

      const saved = await this.lancRepo.save(lanc);
      await this.sincronizarTotalPago(fatura.id);
      return saved;
    }

    // ✅ PAGAMENTO: mantém comportamento atual (amarrado ao mês/ano do sheet)
    const fatura = await this.getOrCreateFatura(cartaoId, Number(dto.mes), Number(dto.ano));

    const lanc = this.lancRepo.create({
      faturaId: fatura.id,
      tipo: 'PAGAMENTO',
      descricao: dto.descricao ?? null,
      data: dto.data as any,
      valor: dto.valor,
    });

    const saved = await this.lancRepo.save(lanc);
    await this.sincronizarTotalPago(fatura.id);
    return saved;
  }

  async editarLancamento(
    cartaoId: number,
    usuarioId: number,
    lancamentoId: number,
    dto: AtualizarLancamentoCartaoDto,
  ) {
    const cartao = await this.getCartaoOrFail(cartaoId, usuarioId);

    const lanc = await this.lancRepo.findOne({
      where: { id: lancamentoId },
      relations: { fatura: true },
    });
    if (!lanc) throw new NotFoundException('Lançamento não encontrado.');

    if (!lanc.fatura || lanc.fatura.cartaoId !== cartaoId) {
      throw new NotFoundException('Lançamento não encontrado para este cartão.');
    }

    const faturaIdAntiga = lanc.faturaId;

    if (dto.tipo !== undefined) lanc.tipo = dto.tipo as any;
    if (dto.descricao !== undefined) lanc.descricao = dto.descricao;
    if (dto.valor !== undefined) lanc.valor = dto.valor;

    // ✅ Se for COMPRA e mudar data -> recalcula competência + salva data no vencimento
    if (dto.data !== undefined) {
      const d = new Date(dto.data as any);
      if (Number.isNaN(d.getTime())) throw new BadRequestException('Data inválida.');

      if (lanc.tipo === 'COMPRA') {
        const { mesFatura, anoFatura, dataCompetencia } = this.calcularCompetenciaCompra(cartao, d);
        const faturaDestino = await this.getOrCreateFatura(cartaoId, mesFatura, anoFatura);

        lanc.data = dataCompetencia as any; // ✅ força para vencimento
        if (faturaDestino.id !== lanc.faturaId) {
          lanc.faturaId = faturaDestino.id;
        }
      } else {
        // PAGAMENTO: mantém a data que o usuário setou
        lanc.data = dto.data as any;
      }
    }

    const saved = await this.lancRepo.save(lanc);

    await this.sincronizarTotalPago(faturaIdAntiga);
    if (saved.faturaId !== faturaIdAntiga) {
      await this.sincronizarTotalPago(saved.faturaId);
    }

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

    const { start, end } = this.rangeMesUTC(ano, mes);

    const lancamentos = await this.lancRepo
      .createQueryBuilder('l')
      .innerJoin(CartaoFatura, 'f', 'f.id = l.faturaId')
      .where('f.cartaoId = :cartaoId', { cartaoId })
      .andWhere('l.data >= :start AND l.data < :end', { start, end })
      .orderBy('l.data', 'DESC')
      .addOrderBy('l.id', 'DESC')
      .getMany();

    const { totalCompras, totalPagamentos } = await this.resumoMesPorData(cartaoId, mes, ano);

    const ajusteFatura = Number(fatura.ajusteFatura || 0);
    const valorFatura = Number(totalCompras) + ajusteFatura;
    const emAberto = Math.max(0, valorFatura - Number(totalPagamentos));

    // ✅ AQUI É O AJUSTE QUE VOCÊ PEDIU:
    // utilizado global considera parcelas futuras (JAN/FEV) mesmo vendo DEZ
    const limiteUtilizado = await this.limiteUtilizadoTotal(cartaoId);

    const limiteVigente = await this.resolveLimiteVigente(cartao, mes, ano, fatura);
    const limiteDisponivel = Math.max(0, limiteVigente - limiteUtilizado);

    // cache coerente (opcional)
    if (Number(fatura.totalPago || 0) !== Number(totalPagamentos)) {
      await this.faturasRepo.update({ id: fatura.id }, { totalPago: Number(totalPagamentos) });
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
        valorFatura,
        totalPago: totalPagamentos,
        emAberto,
        limiteVigente,
        limiteUtilizado,
        limiteDisponivel,
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
