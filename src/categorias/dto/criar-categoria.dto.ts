import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TipoCategoria } from '../enums/tipo-categoria.enum';

export class CriarCategoriaDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome da categoria é obrigatório.' })
  nome!: string;

  @IsEnum(TipoCategoria, {
    message: 'O tipo da categoria deve ser RENDA ou DESPESA.',
  })
  tipo!: TipoCategoria;
}
