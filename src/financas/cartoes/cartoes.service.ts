// src/cartoes/cartoes.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CartaoFatura } from './cartao-fatura.entity';
import { CartaoLancamento } from './cartao-lancamento.entity';
import { Cartao } from './cartao.entity';
import { AjustarFaturaDto } from './dto/ajustar-fatura.dto';
import { AtualizarCartaoDto } from './dto/atualizar-cartao.dto';
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

    // busca último limiteMes anterior ao (ano, mes)
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

    return this.faturasRepo.save(fatura);
  }

  async criarLancamento(cartaoId: number, usuarioId: number, dto: CriarLancamentoCartaoDto) {
    await this.getCartaoOrFail(cartaoId, usuarioId);
    const fatura = await this.getOrCreateFatura(cartaoId, dto.mes, dto.ano);

    const lanc = this.lancRepo.create({
      faturaId: fatura.id,
      tipo: dto.tipo,
      descricao: dto.descricao ?? null,
      data: dto.data,
      valor: dto.valor,
    });

    const saved = await this.lancRepo.save(lanc);

    // Se for pagamento, atualiza totalPago (e libera limite automaticamente)
    if (dto.tipo === 'PAGAMENTO') {
      fatura.totalPago = Number(fatura.totalPago || 0) + Number(dto.valor || 0);
      await this.faturasRepo.save(fatura);
    }

    return saved;
  }

  async detalhesFatura(cartaoId: number, usuarioId: number, mes: number, ano: number) {
    const cartao = await this.getCartaoOrFail(cartaoId, usuarioId);
    const fatura = await this.getOrCreateFatura(cartaoId, mes, ano);

    const lancamentos = await this.lancRepo.find({
      where: { faturaId: fatura.id },
      order: { data: 'DESC', id: 'DESC' },
    });

    const totalCompras = lancamentos
      .filter((l) => l.tipo === 'COMPRA')
      .reduce((acc, l) => acc + Number(l.valor), 0);

    const totalPagamentos = Number(fatura.totalPago || 0);

    const valorFatura = totalCompras + Number(fatura.ajusteFatura || 0);
    const emAberto = Math.max(0, valorFatura - totalPagamentos);

    const limiteVigente = await this.resolveLimiteVigente(cartao, mes, ano, fatura);
    const limiteDisponivel = Math.max(0, limiteVigente - emAberto);

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
        ajusteFatura: Number(fatura.ajusteFatura || 0),
        totalCompras,
        valorFatura,
        totalPago: totalPagamentos,
        emAberto,
        limiteVigente,
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
      fatura: number;
      limiteDisponivel: number;
      mes: number;
      ano: number;
    }> = [];
    for (const c of cartoes) {
      const det = await this.detalhesFatura(c.id, usuarioId, mes, ano);
      result.push({
        cartaoId: c.id,
        nome: c.nome,
        limite: det.fatura.limiteVigente,
        fatura: det.fatura.emAberto, // aqui você pode preferir valorFatura
        limiteDisponivel: det.fatura.limiteDisponivel,
        mes,
        ano,
      });
    }
    return result;
  }

  async listar(usuarioId: number) {
    return this.cartoesRepo.find({ where: { usuario: { id: usuarioId } }, order: { id: 'DESC' } });
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
