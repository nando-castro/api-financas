// src/cartoes/dto/atualizar-cartao.dto.ts
import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class AtualizarCartaoDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsNumber()
  limite?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  diaFechamento?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  diaVencimento?: number;
}
