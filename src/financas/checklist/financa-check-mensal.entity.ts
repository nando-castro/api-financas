import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'financa_check_mensal' })
@Unique('uq_financa_check_mensal', ['usuarioId', 'financaId', 'competencia'])
@Index('idx_financa_check_usuario_comp', ['usuarioId', 'competencia'])
@Index('idx_financa_check_financa_comp', ['financaId', 'competencia'])
export class FinancaCheckMensal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id', type: 'int' })
  usuarioId: number;

  @Column({ name: 'financa_id', type: 'int' })
  financaId: number;

  // "YYYY-MM"
  @Column({ name: 'competencia', type: 'char', length: 7 })
  competencia: string;

  @Column({ name: 'checked', type: 'bool', default: false })
  checked: boolean;

  @Column({ name: 'checked_at', type: 'timestamp', nullable: true })
  checkedAt: Date | null;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamp' })
  atualizadoEm: Date;
}
