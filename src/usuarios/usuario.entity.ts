import {
  Column,
  CreateDateColumn,
  Entity,
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

  // @OneToMany(() => Financa, (financa) => financa.usuario)
  // financas: Financa[];
}
