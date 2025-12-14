import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CriarCartaoDto {
  @IsString()
  nome: string;

  @IsNumber()
  limite: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  diaFechamento?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  diaVencimento?: number | null;
}
