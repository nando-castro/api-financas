import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { Repository } from 'typeorm';
import { Financa } from '../financa.entity';

@Injectable()
export class EstatisticasService {
  constructor(
    @InjectRepository(Financa)
    private financaRepo: Repository<Financa>,
  ) {}

  /**
   * Retorna o saldo acumulado até o mês anterior,
   * considerando mudanças de ano (ex: jan/2026 -> inclui dez/2025)
   */
  private async getSaldoAcumuladoAteMes(
    usuarioId: number,
    mes: number,
    ano: number,
  ): Promise<number> {
    let saldoAcumulado = 0;

    // 🔹 Começa em 2020 ou outro ponto inicial do histórico
    for (let a = 2020; a <= ano; a++) {
      const ultimoMes = a === ano ? mes - 1 : 12;
      if (ultimoMes <= 0) continue;

      for (let m = 1; m <= ultimoMes; m++) {
        const inicioMes = dayjs(`${a}-${m}-01`).startOf('month').toDate();
        const fimMes = dayjs(inicioMes).endOf('month').toDate();

        const financas = await this.financaRepo
          .createQueryBuilder('f')
          .leftJoin('f.usuario', 'u')
          .where('u.id = :usuarioId', { usuarioId })
          .andWhere('f.dataInicio <= :fimMes', { fimMes })
          .andWhere('(f.dataFim IS NULL OR f.dataFim >= :inicioMes)', { inicioMes })
          .getMany();

        const totalRendas = financas
          .filter((f) => f.tipo === 'RENDA')
          .reduce((acc, f) => acc + Number(f.valor), 0);

        const totalDespesas = financas
          .filter((f) => f.tipo === 'DESPESA')
          .reduce((acc, f) => acc + Number(f.valor), 0);

        saldoAcumulado += totalRendas - totalDespesas;
      }
    }

    return saldoAcumulado;
  }

  // 🔹 1. Estatísticas Mensais
  async estatisticasMensal(usuarioId: number, mes?: number, ano?: number) {
    const hoje = dayjs();
    const mesAtual = mes ?? hoje.month() + 1;
    const anoAtual = ano ?? hoje.year();

    const inicioMes = dayjs(`${anoAtual}-${mesAtual}-01`).startOf('month').toDate();
    const fimMes = dayjs(inicioMes).endOf('month').toDate();

    const financas = await this.financaRepo
      .createQueryBuilder('f')
      .leftJoin('f.usuario', 'u')
      .where('u.id = :usuarioId', { usuarioId })
      .andWhere('f.dataInicio <= :fimMes', { fimMes })
      .andWhere('(f.dataFim IS NULL OR f.dataFim >= :inicioMes)', { inicioMes })
      .getMany();

    const totalRendas = financas
      .filter((f) => f.tipo === 'RENDA')
      .reduce((acc, f) => acc + Number(f.valor), 0);

    const totalDespesas = financas
      .filter((f) => f.tipo === 'DESPESA')
      .reduce((acc, f) => acc + Number(f.valor), 0);

    const saldo = totalRendas - totalDespesas;

    const saldoAnterior = await this.getSaldoAcumuladoAteMes(usuarioId, mesAtual, anoAtual);

    const saldoAcumulado = saldoAnterior + saldo;

    const percentualEconomia =
      totalRendas > 0 ? ((saldo / totalRendas) * 100).toFixed(2) + '%' : '0%';

    const recomendacao =
      saldo > 0
        ? 'Parabéns! Você está com saldo positivo. Considere investir parte do excedente.'
        : saldo < 0
          ? 'Atenção! Você gastou mais do que ganhou neste mês.'
          : 'Você manteve um bom equilíbrio financeiro.';

    return {
      mes: dayjs(inicioMes).format('MMMM'),
      ano: anoAtual,
      totalRendas,
      totalDespesas,
      saldo,
      saldoAnterior,
      saldoAcumulado,
      percentualEconomia,
      recomendacao,
    };
  }

  // 🔹 2. Estatísticas Anuais
  async estatisticasAnual(usuarioId: number, ano?: number) {
    const anoAtual = ano ?? dayjs().year();
    const resultados: {
      mes: string;
      rendas: number;
      despesas: number;
      saldo: number;
      saldoAnterior: number;
      saldoAcumulado: number;
    }[] = [];

    let saldoAcumulado = await this.getSaldoAcumuladoAteMes(usuarioId, 1, anoAtual); // saldo herdado de anos anteriores

    for (let mes = 1; mes <= 12; mes++) {
      const inicioMes = dayjs(`${anoAtual}-${mes}-01`).startOf('month').toDate();
      const fimMes = dayjs(inicioMes).endOf('month').toDate();

      const financas = await this.financaRepo
        .createQueryBuilder('f')
        .leftJoin('f.usuario', 'u')
        .where('u.id = :usuarioId', { usuarioId })
        .andWhere('f.dataInicio <= :fimMes', { fimMes })
        .andWhere('(f.dataFim IS NULL OR f.dataFim >= :inicioMes)', { inicioMes })
        .getMany();

      const totalRendas = financas
        .filter((f) => f.tipo === 'RENDA')
        .reduce((acc, f) => acc + Number(f.valor), 0);

      const totalDespesas = financas
        .filter((f) => f.tipo === 'DESPESA')
        .reduce((acc, f) => acc + Number(f.valor), 0);

      const saldo = totalRendas - totalDespesas;

      const saldoAnterior = saldoAcumulado;
      saldoAcumulado += saldo;

      resultados.push({
        mes: dayjs(inicioMes).format('MMMM'),
        rendas: totalRendas,
        despesas: totalDespesas,
        saldo,
        saldoAnterior,
        saldoAcumulado,
      });
    }

    return {
      ano: anoAtual,
      meses: resultados,
    };
  }

  // 🔹 3. Tendência (comparativo mês atual x anterior)
  async tendencia(usuarioId: number) {
    const hoje = dayjs();
    const mesAtual = hoje.month() + 1;
    const anoAtual = hoje.year();

    const saldoAtual = await this.getSaldoVigente(usuarioId, mesAtual, anoAtual);
    const mesAnterior = mesAtual === 1 ? 12 : mesAtual - 1;
    const anoAnterior = mesAtual === 1 ? anoAtual - 1 : anoAtual;
    const saldoAnterior = await this.getSaldoVigente(usuarioId, mesAnterior, anoAnterior);

    const variacao =
      saldoAnterior === 0 ? 100 : ((saldoAtual - saldoAnterior) / Math.abs(saldoAnterior)) * 100;

    return {
      tendencia: saldoAtual >= saldoAnterior ? 'positiva' : 'negativa',
      saldoMesAtual: saldoAtual,
      saldoMesAnterior: saldoAnterior,
      variacaoPercentual: `${variacao >= 0 ? '+' : ''}${variacao.toFixed(2)}%`,
    };
  }

  private async getSaldoVigente(usuarioId: number, mes: number, ano: number): Promise<number> {
    const inicioMes = dayjs(`${ano}-${mes}-01`).startOf('month').toDate();
    const fimMes = dayjs(inicioMes).endOf('month').toDate();

    const financas = await this.financaRepo
      .createQueryBuilder('f')
      .leftJoin('f.usuario', 'u')
      .where('u.id = :usuarioId', { usuarioId })
      .andWhere('f.dataInicio <= :fimMes', { fimMes })
      .andWhere('(f.dataFim IS NULL OR f.dataFim >= :inicioMes)', { inicioMes })
      .getMany();

    const totalRendas = financas
      .filter((f) => f.tipo === 'RENDA')
      .reduce((acc, f) => acc + Number(f.valor), 0);

    const totalDespesas = financas
      .filter((f) => f.tipo === 'DESPESA')
      .reduce((acc, f) => acc + Number(f.valor), 0);

    return totalRendas - totalDespesas;
  }

  // 🔹 4. Estatísticas por Categoria (agrupadas e somadas)
  async porCategoria(usuarioId: number, mes?: number, ano?: number) {
    const hoje = dayjs();
    const mesAtual = mes ?? hoje.month() + 1;
    const anoAtual = ano ?? hoje.year();

    const inicioMes = dayjs(`${anoAtual}-${mesAtual}-01`).startOf('month').toDate();
    const fimMes = dayjs(inicioMes).endOf('month').toDate();

    const financas = await this.financaRepo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.categoria', 'c')
      .leftJoin('f.usuario', 'u')
      .where('u.id = :usuarioId', { usuarioId })
      .andWhere('f.dataInicio <= :fimMes', { fimMes })
      .andWhere('(f.dataFim IS NULL OR f.dataFim >= :inicioMes)', { inicioMes })
      .getMany();

    // 🔸 Agrupar e somar por tipo + categoria
    const agrupadas = financas.reduce(
      (acc, f) => {
        const nomeCategoria = f.categoria?.nome ?? 'Sem categoria';
        const chave = `${f.tipo}-${nomeCategoria}`;

        if (!acc[chave]) {
          acc[chave] = {
            tipo: f.tipo,
            categoria: nomeCategoria,
            total: 0,
          };
        }

        acc[chave].total += Number(f.valor);
        return acc;
      },
      {} as Record<string, { tipo: string; categoria: string; total: number }>,
    );

    // 🔸 Converter em array e ordenar
    return Object.values(agrupadas).sort((a, b) => {
      if (a.tipo === b.tipo) return a.categoria.localeCompare(b.categoria);
      return a.tipo.localeCompare(b.tipo);
    });
  }
}
