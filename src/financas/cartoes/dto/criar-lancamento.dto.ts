// src/cartoes/dto/criar-lancamento.dto.ts
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class CriarLancamentoCartaoDto {
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;

  @IsInt()
  @Min(2000)
  @Max(2100)
  ano: number;

  @IsEnum(['COMPRA', 'PAGAMENTO'])
  tipo: 'COMPRA' | 'PAGAMENTO';

  @IsOptional()
  descricao?: string;

  @IsNotEmpty()
  @IsDateString()
  data: Date;

  @IsNumber()
  valor: number;
}
