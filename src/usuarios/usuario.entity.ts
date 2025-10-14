import { Categoria } from 'src/categorias/categoria.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
// import { Financa } from '../financas/financa.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column()
  senha: string;

  @Column({ default: 'light' })
  tema: string;

  @Column({ default: 'BRL' })
  moeda: string;

  @Column({ default: 'pt-BR' })
  idioma: string;

  @CreateDateColumn()
  criadoEm: Date;

  @OneToMany(() => Categoria, (categoria) => categoria.usuario)
  categorias: Categoria[];

  // @OneToMany(() => Financa, (financa) => financa.usuario)
  // financas: Financa[];
}
