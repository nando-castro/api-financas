import { Usuario } from 'src/usuarios/usuario.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('saldo_mensal')
@Unique(['usuario', 'ano', 'mes'])
export class SaldoMensal {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, { nullable: false })
  usuario: Usuario;

  @Column()
  ano: number;

  @Column()
  mes: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalRendas: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalDespesas: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  saldoAtual: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  saldoAcumulado: number;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
