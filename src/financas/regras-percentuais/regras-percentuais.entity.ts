import { Categoria } from 'src/categorias/categoria.entity';
import { Usuario } from 'src/usuarios/usuario.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BasePercentualEnum } from './regras-percentuais.enums';

@Entity('regra_percentual')
export class RegraPercentual {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  percentual: number;

  @Column({
    type: 'enum',
    enum: BasePercentualEnum,
  })
  basePercentual: BasePercentualEnum;

  @ManyToOne(() => Categoria, {
    nullable: true,
  })
  categoria: Categoria | null;

  @ManyToOne(() => Usuario)
  usuario: Usuario;

  @Column({
    default: true,
  })
  ativo: boolean;
}
