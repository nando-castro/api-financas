import { IsNotEmpty } from 'class-validator';

export class CriarCategoriaDto {
  @IsNotEmpty({ message: 'O nome da categoria é obrigatório.' })
  nome: string;
}
