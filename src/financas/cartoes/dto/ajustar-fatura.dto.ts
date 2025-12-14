// src/cartoes/dto/ajustar-fatura.dto.ts
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class AjustarFaturaDto {
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;

  @IsInt()
  @Min(2000)
  @Max(2100)
  ano: number;

  // altera apenas do mês
  @IsOptional()
  @IsNumber()
  limiteMes?: number;

  // “editar a fatura” (ajuste manual do mês)
  @IsOptional()
  @IsNumber()
  ajusteFatura?: number;
}
