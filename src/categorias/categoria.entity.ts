import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
// import { Financa } from '../financas/financa.entity';
import { Financa } from 'src/financas/financa.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('categorias')
export class Categoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @CreateDateColumn()
  criadoEm: Date;

  // Categoria pertence a um usuário
  @ManyToOne(() => Usuario, (usuario) => usuario.categorias, {
    onDelete: 'CASCADE',
  })
  usuario: Usuario;

  @OneToMany(() => Financa, (financa) => financa.categoria)
  financas: Financa[];
}
