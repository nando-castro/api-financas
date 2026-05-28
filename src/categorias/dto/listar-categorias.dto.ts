import { IsEnum, IsOptional } from 'class-validator';
import { TipoCategoria } from '../enums/tipo-categoria.enum';

export class ListarCategoriasDto {
  @IsOptional()
  @IsEnum(TipoCategoria, {
    message: 'O tipo da categoria deve ser RENDA ou DESPESA.',
  })
  tipo?: TipoCategoria;
}
