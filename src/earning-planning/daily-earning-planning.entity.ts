import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

@Entity({ name: 'daily_earning_planning' })
@Unique('uq_earning_planning_user_date', ['usuarioId', 'date'])
@Index('idx_earning_planning_user_period', ['usuarioId', 'year', 'month'])
export class DailyEarningPlanning {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id', type: 'int' })
  usuarioId: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'int' })
  day: number;

  @Column({ name: 'planned_income', type: 'decimal', precision: 12, scale: 2, default: 0 })
  plannedIncome: number;

  @Column({ name: 'planned_expense', type: 'decimal', precision: 12, scale: 2, default: 0 })
  plannedExpense: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

