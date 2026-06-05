import { Categoria } from 'src/categorias/categoria.entity';
import { Usuario } from 'src/usuarios/usuario.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BasePercentualEnum } from './regras-percentuais.enums';

@Entity('regra_percentual')
export class RegraPercentual {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nome!: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  percentual!: number;

  @Column({
    type: 'enum',
    enum: BasePercentualEnum,
  })
  basePercentual!: BasePercentualEnum;

  @ManyToOne(() => Categoria, {
    nullable: true,
  })
  categoria!: Categoria | null;

  @ManyToOne(() => Usuario)
  usuario!: Usuario;

  @Column({
    default: true,
  })
  ativo!: boolean;

  @Column({ type: 'int', nullable: true, default: null })
  mesReferencia!: number | null;

  @Column({ type: 'int', nullable: true, default: null })
  anoReferencia!: number | null;

  @Column({ type: 'date', nullable: true, default: null })
  dataInicio!: Date | null;

  @Column({ type: 'date', nullable: true, default: null })
  dataFim!: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  criadoEm!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  atualizadoEm!: Date;
}
