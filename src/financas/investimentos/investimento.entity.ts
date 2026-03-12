import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InvestimentoAporte } from './investimento-aporte.entity';

@Entity('investimentos')
export class Investimento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  usuarioId: number;

  @Column({ type: 'varchar', length: 150 })
  nome: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  valorInicial: number;

  @Column({ type: 'decimal', precision: 8, scale: 4 })
  taxaMensal: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  aporteMensal: number;

  @Column({ type: 'date' })
  dataInicio: string;

  @OneToMany(() => InvestimentoAporte, (aporte) => aporte.investimento)
  aportes: InvestimentoAporte[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
