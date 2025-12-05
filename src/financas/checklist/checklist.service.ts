import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { In, Repository } from 'typeorm';
import { Financa } from '../financa.entity';
import { ChecklistBulkItemDto } from './dto/checklist.dto';
import { FinancaCheckMensal } from './financa-check-mensal.entity';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function competenciaKey(mes: number, ano: number) {
  return `${ano}-${pad2(mes)}`;
}

function dataLancamentoNoMes(dataInicio: Date, mes: number, ano: number) {
  const inicioMes = dayjs(`${ano}-${pad2(mes)}-01`).startOf('month');
  const fimMes = inicioMes.endOf('month');
  const dia = dayjs(dataInicio).date();
  const diaClamped = Math.min(dia, fimMes.date());
  return inicioMes.date(diaClamped);
}

function diffMeses(ini: dayjs.Dayjs, fim: dayjs.Dayjs) {
  return (fim.year() - ini.year()) * 12 + (fim.month() - ini.month());
}

@Injectable()
export class ChecklistService {
  constructor(
    @InjectRepository(Financa)
    private readonly financaRepo: Repository<Financa>,
    @InjectRepository(FinancaCheckMensal)
    private readonly checkRepo: Repository<FinancaCheckMensal>,
  ) {}

  async mensal(usuarioId: number, mes?: number, ano?: number) {
    const hoje = dayjs();
    const mesAtual = mes ?? hoje.month() + 1;
    const anoAtual = ano ?? hoje.year();

    const inicioMes = dayjs(`${anoAtual}-${pad2(mesAtual)}-01`)
      .startOf('month')
      .toDate();
    const fimMes = dayjs(inicioMes).endOf('month').toDate();

    const financas = await this.financaRepo
      .createQueryBuilder('f')
      .leftJoin('f.usuario', 'u')
      .leftJoinAndSelect('f.categoria', 'c')
      .where('u.id = :usuarioId', { usuarioId })
      .andWhere('f.dataInicio <= :fimMes', { fimMes })
      .andWhere('(f.dataFim IS NULL OR f.dataFim >= :inicioMes)', { inicioMes })
      .getMany();

    const comp = competenciaKey(mesAtual, anoAtual);
    const ids = financas.map((f) => f.id).filter((id): id is number => id != null);

    const checks = ids.length
      ? await this.checkRepo.find({
          where: { usuarioId, competencia: comp, financaId: In(ids) },
        })
      : [];

    const checkMap = new Map<number, FinancaCheckMensal>();
    for (const c of checks) checkMap.set(c.financaId, c);

    const inicioMesDayjs = dayjs(`${anoAtual}-${pad2(mesAtual)}-01`).startOf('month');

    const itens = financas
      .map((f: any) => {
        const chk = checkMap.get(f.id);

        const parcelas: number | null = typeof f.parcelas === 'number' ? f.parcelas : null;

        // se tiver parcelas, calcula parcela atual e filtra fora do range
        let parcelaAtual: number | null = null;
        if (parcelas && parcelas > 0) {
          const ini = dayjs(f.dataInicio).startOf('month');
          parcelaAtual = diffMeses(ini, inicioMesDayjs) + 1;
          if (parcelaAtual < 1 || parcelaAtual > parcelas) return null;
        }

        const dl = dataLancamentoNoMes(f.dataInicio, mesAtual, anoAtual);

        return {
          financaId: f.id,
          nome: f.nome ?? f.descricao ?? 'Sem descrição',
          tipo: f.tipo,
          valor: Number(f.valor),
          categoriaId: f.categoria?.id ?? null,
          dataLancamento: dl.format('YYYY-MM-DD'),
          competencia: comp,
          parcelas,
          parcelaAtual,
          checked: chk?.checked ?? false,
          checkedAt: chk?.checkedAt ? chk.checkedAt.toISOString() : null,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        const da = a.dataLancamento.localeCompare(b.dataLancamento);
        if (da !== 0) return da as number;
        return String(a.nome).localeCompare(String(b.nome));
      });

    return { mes: mesAtual, ano: anoAtual, itens };
  }

  async bulkUpdate(usuarioId: number, mes: number, ano: number, itens: ChecklistBulkItemDto[]) {
    if (!mes || !ano) throw new BadRequestException('mes e ano são obrigatórios.');
    if (!Array.isArray(itens)) throw new BadRequestException('itens inválido.');

    const comp = competenciaKey(mes, ano);

    // normaliza ids e remove duplicados (último ganha)
    const map = new Map<number, boolean>();
    for (const it of itens) {
      if (!it?.financaId) continue;
      map.set(Number(it.financaId), !!it.checked);
    }
    const ids = [...map.keys()];
    if (ids.length === 0) return { ok: true, competencia: comp, updated: 0 };

    // garante que todas as finanças pertencem ao usuário
    const rows = await this.financaRepo
      .createQueryBuilder('f')
      .select(['f.id'])
      .leftJoin('f.usuario', 'u')
      .where('u.id = :usuarioId', { usuarioId })
      .andWhere('f.id IN (:...ids)', { ids })
      .getMany();

    const allowed = new Set(rows.map((r) => r.id));
    const notAllowed = ids.filter((id) => !allowed.has(id));
    if (notAllowed.length) {
      throw new ForbiddenException('Uma ou mais finanças não pertencem ao usuário.');
    }

    const now = new Date();
    const upserts = ids.map((financaId) => {
      const checked = map.get(financaId)!;
      return this.checkRepo.create({
        usuarioId,
        financaId,
        competencia: comp,
        checked,
        checkedAt: checked ? now : null,
      });
    });

    await this.checkRepo.upsert(upserts as any, ['usuarioId', 'financaId', 'competencia']);

    return { ok: true, competencia: comp, updated: upserts.length };
  }
}
