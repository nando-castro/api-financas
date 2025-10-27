import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { Repository } from 'typeorm';
import { Financa } from '../financa.entity';
import { SaldoMensal } from './saldo-mensal.entity';

@Injectable()
export class SaldoMensalService {
  constructor(
    @InjectRepository(SaldoMensal)
    private saldoRepo: Repository<SaldoMensal>,

    @InjectRepository(Financa)
    private financaRepo: Repository<Financa>,
  ) {}

  async atualizarSaldo(usuarioId: number, ano: number, mes: number) {
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
      .reduce((acc: number, f: Financa) => {
        const v = Number(f.valor);
        return acc + (Number.isFinite(v) ? v : 0);
      }, 0);
    const totalDespesas = financas
      .filter((f) => f.tipo === 'DESPESA')
      .reduce((acc: number, f: Financa) => {
        const v = Number(f.valor);
        return acc + (Number.isFinite(v) ? v : 0);
      }, 0);

    const saldoAtual = totalRendas - totalDespesas;

    // 🔹 Busca o saldo acumulado até o mês anterior (mesmo se mudar o ano)
    const mesAnterior = mes === 1 ? 12 : mes - 1;
    const anoAnterior = mes === 1 ? ano - 1 : ano;

    const saldoAnterior =
      (
        await this.saldoRepo.findOne({
          where: {
            usuario: { id: usuarioId },
            ano: anoAnterior,
            mes: mesAnterior,
          },
        })
      )?.saldoAcumulado ?? 0;

    const saldoAcumulado = saldoAnterior + saldoAtual;

    // 🔹 Salva ou atualiza
    await this.saldoRepo.save({
      usuario: { id: usuarioId },
      ano,
      mes,
      totalRendas,
      totalDespesas,
      saldoAtual,
      saldoAcumulado,
    });
  }

  async buscarSaldo(usuarioId: number, ano: number, mes: number) {
    return this.saldoRepo.findOne({
      where: { usuario: { id: usuarioId }, ano, mes },
    });
  }
}
