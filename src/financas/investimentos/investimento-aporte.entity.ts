import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Investimento } from './investimento.entity';

@Entity('investimentos_aportes')
export class InvestimentoAporte {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  investimentoId: number;

  @ManyToOne(() => Investimento, (investimento) => investimento.aportes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'investimentoId' })
  investimento: Investimento;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  valorMensal: number;

  @Column({ type: 'date' })
  dataInicio: string; // sempre YYYY-MM-01

  @Column({ type: 'date', nullable: true })
  dataFim: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
