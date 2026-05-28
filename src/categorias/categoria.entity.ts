import { Financa } from 'src/financas/financa.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { TipoCategoria } from './enums/tipo-categoria.enum';

@Entity('categorias')
export class Categoria {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nome!: string;

  @Column({
    type: 'enum',
    enum: TipoCategoria,
  })
  tipo!: TipoCategoria;

  @CreateDateColumn()
  criadoEm!: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.categorias, {
    onDelete: 'CASCADE',
  })
  usuario!: Usuario;

  @OneToMany(() => Financa, (financa) => financa.categoria)
  financas!: Financa[];
}
