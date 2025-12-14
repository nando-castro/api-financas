// src/financas/financa.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Categoria } from '../categorias/categoria.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Cartao } from './cartoes/cartao.entity';

export enum FormaPagamento {
  CARTAO = 'CARTAO',
  PIX = 'PIX',
  DINHEIRO = 'DINHEIRO',
}

@Entity('financas')
export class Financa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value),
    },
  })
  valor: number;

  @Column()
  tipo: 'RENDA' | 'DESPESA';

  @Column({ nullable: true })
  parcelas: number;

  @Column({ type: 'date' })
  dataInicio: Date;

  @Column({ type: 'date', nullable: true })
  dataFim: Date;

  @CreateDateColumn()
  criadoEm: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.financas, { onDelete: 'CASCADE' })
  usuario: Usuario;

  @ManyToOne(() => Categoria, (categoria) => categoria.financas, { eager: true, nullable: true })
  categoria?: Categoria | null;

  // ========= NOVO =========
  @Column({ type: 'varchar', length: 20, nullable: true })
  formaPagamento?: FormaPagamento | null;

  @Column({ type: 'int', nullable: true })
  cartaoId?: number | null;

  @ManyToOne(() => Cartao, (cartao) => cartao.financas, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'cartaoId' })
  cartao?: Cartao | null;
}
