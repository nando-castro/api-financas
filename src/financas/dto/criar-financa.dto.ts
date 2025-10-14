import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CriarFinancaDto {
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  nome: string;

  @IsNumber({}, { message: 'O valor deve ser numérico.' })
  valor: number;

  @IsEnum(['RENDA', 'DESPESA'], { message: 'O tipo deve ser RENDA ou DESPESA.' })
  tipo: 'RENDA' | 'DESPESA';

  @IsOptional()
  @IsNumber({}, { message: 'As parcelas devem ser numéricas.' })
  parcelas?: number;

  @IsNotEmpty({ message: 'A data de início é obrigatória.' })
  @IsDateString({}, { message: 'A data de início deve ser uma data válida.' })
  dataInicio: Date;

  @IsOptional()
  @IsDateString({}, { message: 'A data de fim deve ser uma data válida.' })
  dataFim?: Date;

  @IsOptional()
  @IsNumber({}, { message: 'O ID da categoria deve ser numérico.' })
  categoriaId?: number;
}
