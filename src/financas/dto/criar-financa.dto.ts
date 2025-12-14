// src/financas/dto/criar-financa.dto.ts
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { FormaPagamento } from '../financa.enums';

export enum TipoFinanca {
  RENDA = 'RENDA',
  DESPESA = 'DESPESA',
}

export class CriarFinancaDto {
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  nome: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'O valor deve ser numérico.' })
  valor: number;

  @IsEnum(TipoFinanca, { message: 'O tipo deve ser RENDA ou DESPESA.' })
  tipo: TipoFinanca;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'As parcelas devem ser um número inteiro.' })
  parcelas?: number;

  @IsNotEmpty({ message: 'A data de início é obrigatória.' })
  @IsDateString({}, { message: 'A data de início deve ser uma data válida.' })
  dataInicio: Date;

  @IsOptional()
  @IsDateString({}, { message: 'A data de fim deve ser uma data válida.' })
  dataFim?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O ID da categoria deve ser numérico.' })
  categoriaId?: number;

  @IsOptional()
  @ValidateIf((o) => o.tipo === TipoFinanca.DESPESA)
  @IsEnum(FormaPagamento, {
    message: 'A forma de pagamento deve ser CARTAO, PIX ou DINHEIRO.',
  })
  formaPagamento?: FormaPagamento;

  @IsOptional()
  @ValidateIf((o) => o.tipo === TipoFinanca.DESPESA && o.formaPagamento === FormaPagamento.CARTAO)
  @Type(() => Number)
  @IsInt({ message: 'O ID do cartão deve ser numérico.' })
  cartaoId?: number;
}
