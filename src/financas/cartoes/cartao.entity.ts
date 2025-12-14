// src/cartoes/cartao.entity.ts
import { Usuario } from 'src/usuarios/usuario.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Financa } from '../financa.entity';
import { CartaoFatura } from './cartao-fatura.entity';

@Entity('cartoes')
export class Cartao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120 })
  nome: string;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string | number) => Number(v) },
  })
  limite: number; // limite base (fallback)

  @Column({ type: 'int', nullable: true })
  diaFechamento?: number | null;

  @Column({ type: 'int', nullable: true })
  diaVencimento?: number | null;

  @CreateDateColumn()
  criadoEm: Date;

  @Column({ type: 'int' })
  usuarioId: number;

  @ManyToOne(() => Usuario, (u) => u.cartoes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;

  @OneToMany(() => CartaoFatura, (f) => f.cartao)
  faturas: CartaoFatura[];

  @OneToMany(() => Financa, (f) => f.cartao)
  financas: Financa[];
}
