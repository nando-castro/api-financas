// src/cartoes/cartao-lancamento.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CartaoFatura } from './cartao-fatura.entity';

export type TipoLancamentoCartao = 'COMPRA' | 'PAGAMENTO';

@Entity('cartao_lancamentos')
export class CartaoLancamento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  faturaId: number;

  @ManyToOne(() => CartaoFatura, (f) => f.lancamentos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'faturaId' })
  fatura: CartaoFatura;

  @Column({ type: 'varchar', length: 20 })
  tipo: TipoLancamentoCartao;

  @Column({ type: 'varchar', length: 200, nullable: true })
  descricao?: string | null;

  @Column({ type: 'date' })
  data: Date;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string | number) => Number(v) },
  })
  valor: number;

  @CreateDateColumn()
  criadoEm: Date;
}
