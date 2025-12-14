// src/cartoes/cartao-fatura.entity.ts
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { CartaoLancamento } from './cartao-lancamento.entity';
import { Cartao } from './cartao.entity';

@Entity('cartao_faturas')
@Unique(['cartaoId', 'mes', 'ano'])
export class CartaoFatura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  cartaoId: number;

  @ManyToOne(() => Cartao, (c) => c.faturas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cartaoId' })
  cartao: Cartao;

  @Column({ type: 'int' })
  mes: number;

  @Column({ type: 'int' })
  ano: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (v: number | null) => v,
      from: (v: string | number | null) => (v == null ? null : Number(v)),
    },
  })
  limiteMes?: number | null;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string | number) => Number(v) },
  })
  ajusteFatura: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string | number) => Number(v) },
  })
  totalPago: number;

  @CreateDateColumn()
  criadoEm: Date;

  @OneToMany(() => CartaoLancamento, (l) => l.fatura)
  lancamentos: CartaoLancamento[];
}
