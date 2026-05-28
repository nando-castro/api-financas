import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TipoCategoria } from '../enums/tipo-categoria.enum';

export class AtualizarCategoriaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'O nome da categoria não pode ser vazio.' })
  nome?: string;

  @IsOptional()
  @IsEnum(TipoCategoria, {
    message: 'O tipo da categoria deve ser RENDA ou DESPESA.',
  })
  tipo?: TipoCategoria;
}
