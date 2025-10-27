import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Categoria } from '../categorias/categoria.entity';
import { Usuario } from '../usuarios/usuario.entity';

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
      to: (value: number) => value, // antes de salvar
      from: (value: string | number) => Number(value), // ao ler do banco
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
}
