import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UpdateDailyEarningPlanningDto,
  UpsertMonthlyEarningPlanningDto,
} from './dto/earning-planning.dto';
import { DailyEarningPlanning } from './daily-earning-planning.entity';

@Injectable()
export class EarningPlanningService {
  constructor(
    @InjectRepository(DailyEarningPlanning)
    private readonly repository: Repository<DailyEarningPlanning>,
  ) {}

  private daysInMonth(year: number, month: number) {
    return new Date(year, month, 0).getDate();
  }

  private dateFor(year: number, month: number, day: number) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  private validateDay(year: number, month: number, day: number, date: string) {
    if (day > this.daysInMonth(year, month) || date.slice(0, 10) !== this.dateFor(year, month, day)) {
      throw new BadRequestException(`Data inválida para o dia ${day} do período informado.`);
    }
  }

  private response(year: number, month: number, saved: DailyEarningPlanning[]) {
    const byDay = new Map(saved.map((item) => [item.day, item]));
    const days = Array.from({ length: this.daysInMonth(year, month) }, (_, index) => {
      const day = index + 1;
      const item = byDay.get(day);
      const plannedIncome = Number(item?.plannedIncome ?? 0);
      const plannedExpense = Number(item?.plannedExpense ?? 0);
      return {
        id: item?.id ?? null,
        date: this.dateFor(year, month, day),
        day,
        plannedIncome,
        plannedExpense,
        balance: plannedIncome - plannedExpense,
      };
    });
    const totalIncome = days.reduce((sum, item) => sum + item.plannedIncome, 0);
    const totalExpense = days.reduce((sum, item) => sum + item.plannedExpense, 0);
    const filledDays = days.filter((item) => item.plannedIncome > 0 || item.plannedExpense > 0).length;

    return {
      year,
      month,
      totalIncome,
      totalExpense,
      totalBalance: totalIncome - totalExpense,
      filledDays,
      averageDailyIncome: filledDays ? totalIncome / filledDays : 0,
      days,
    };
  }

  async getMonth(usuarioId: number, year: number, month: number) {
    const saved = await this.repository.find({
      where: { usuarioId, year, month },
      order: { day: 'ASC' },
    });
    return this.response(year, month, saved);
  }

  async upsertMonth(usuarioId: number, dto: UpsertMonthlyEarningPlanningDto) {
    const uniqueDays = new Set<number>();
    for (const item of dto.days) {
      this.validateDay(dto.year, dto.month, item.day, item.date);
      if (uniqueDays.has(item.day)) throw new BadRequestException(`Dia ${item.day} duplicado.`);
      uniqueDays.add(item.day);
    }

    await this.repository.manager.transaction(async (manager) => {
      const repo = manager.getRepository(DailyEarningPlanning);
      for (const item of dto.days) {
        const plannedIncome = Number(item.plannedIncome);
        const plannedExpense = Number(item.plannedExpense);
        await repo.upsert(
          {
            usuarioId,
            year: dto.year,
            month: dto.month,
            day: item.day,
            date: item.date.slice(0, 10),
            plannedIncome,
            plannedExpense,
            balance: plannedIncome - plannedExpense,
          },
          { conflictPaths: ['usuarioId', 'date'] },
        );
      }
    });

    return this.getMonth(usuarioId, dto.year, dto.month);
  }

  async updateDay(usuarioId: number, id: number, dto: UpdateDailyEarningPlanningDto) {
    const item = await this.repository.findOne({ where: { id, usuarioId } });
    if (!item) throw new NotFoundException('Planejamento diário não encontrado.');
    item.plannedIncome = Number(dto.plannedIncome);
    item.plannedExpense = Number(dto.plannedExpense);
    item.balance = item.plannedIncome - item.plannedExpense;
    return this.repository.save(item);
  }

  async deleteMonth(usuarioId: number, year: number, month: number) {
    await this.repository.delete({ usuarioId, year, month });
    return { message: 'Planejamento mensal removido com sucesso.' };
  }
}

