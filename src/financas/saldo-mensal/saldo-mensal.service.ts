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

    // 🔹 Conversão segura de valores para número
    const parseValor = (v: any) => {
      const n = Number(v);
      return isNaN(n) ? 0 : n;
    };

    const totalRendas = financas
      .filter((f) => f.tipo === 'RENDA')
      .reduce((acc, f) => acc + parseValor(f.valor), 0);

    const totalDespesas = financas
      .filter((f) => f.tipo === 'DESPESA')
      .reduce((acc, f) => acc + parseValor(f.valor), 0);

    // 🔹 Garante que são números
    const saldoAtual = Number(totalRendas) - Number(totalDespesas);

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

    const saldoAcumulado = Number(saldoAnterior) + Number(saldoAtual);

    // 🔹 Verifica se já existe registro
    const existente = await this.saldoRepo.findOne({
      where: { usuario: { id: usuarioId }, ano, mes },
    });

    if (existente) {
      existente.totalRendas = Number(totalRendas);
      existente.totalDespesas = Number(totalDespesas);
      existente.saldoAtual = Number(saldoAtual);
      existente.saldoAcumulado = Number(saldoAcumulado);
      existente.atualizadoEm = new Date();

      await this.saldoRepo.save(existente);
    } else {
      const novoSaldo = this.saldoRepo.create({
        usuario: { id: usuarioId },
        ano,
        mes,
        totalRendas: Number(totalRendas),
        totalDespesas: Number(totalDespesas),
        saldoAtual: Number(saldoAtual),
        saldoAcumulado: Number(saldoAcumulado),
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      });

      await this.saldoRepo.save(novoSaldo);
    }
  }

  async buscarSaldo(usuarioId: number, ano: number, mes: number) {
    return this.saldoRepo.findOne({
      where: { usuario: { id: usuarioId }, ano, mes },
    });
  }
}
