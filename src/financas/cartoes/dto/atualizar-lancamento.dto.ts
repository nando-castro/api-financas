import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class AtualizarLancamentoCartaoDto {
  @IsOptional()
  @IsEnum(['COMPRA', 'PAGAMENTO'])
  tipo?: 'COMPRA' | 'PAGAMENTO';

  @IsOptional()
  @IsString()
  descricao?: string | null;

  @IsOptional()
  @IsDateString()
  data?: string; // "YYYY-MM-DD"

  @IsOptional()
  @IsNumber()
  valor?: number;
}
