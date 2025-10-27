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

  private async getSaldoAcumuladoAteMes(
    usuarioId: number,
    mes: number,
    ano: number,
  ): Promise<number> {
    let saldoAcumulado = 0;

    for (let m = 1; m <= mes; m++) {
      const inicioMes = dayjs(`${ano}-${m}-01`).startOf('month').toDate();
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

    // 🔹 Buscar saldo do mês anterior
    const mesAnterior = mesAtual === 1 ? 12 : mesAtual - 1;
    const anoAnterior = mesAtual === 1 ? anoAtual - 1 : anoAtual;
    // const saldoAnterior = await this.getSaldoVigente(usuarioId, mesAnterior, anoAnterior);
    const saldoAnterior = await this.getSaldoAcumuladoAteMes(usuarioId, mesAnterior, anoAnterior);

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

    let saldoAnterior = 0;

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
      const saldoAcumulado = saldoAnterior + saldo;

      resultados.push({
        mes: dayjs(inicioMes).format('MMMM'),
        rendas: totalRendas,
        despesas: totalDespesas,
        saldo,
        saldoAnterior,
        saldoAcumulado,
      });

      saldoAnterior = saldoAcumulado; // prepara para o próximo mês
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

  // 🔹 4. Estatísticas por Categoria
  async porCategoria(usuarioId: number) {
    const financas = await this.financaRepo.find({
      where: { usuario: { id: usuarioId } },
      relations: ['categoria'],
    });

    const agrupadas = financas.reduce(
      (acc, f) => {
        const nomeCategoria = f.categoria?.nome ?? 'Sem categoria';
        const chave = `${f.tipo}-${nomeCategoria}`;

        if (!acc[chave]) {
          acc[chave] = { nome: nomeCategoria, tipo: f.tipo, total: 0 };
        }

        acc[chave].total += Number(f.valor);
        return acc;
      },
      {} as Record<string, any>,
    );

    return {
      categorias: Object.values(agrupadas),
    };
  }
}
