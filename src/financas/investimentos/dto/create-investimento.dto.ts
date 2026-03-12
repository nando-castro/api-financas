import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class CreateInvestimentoDto {
  @IsNotEmpty()
  nome: string;

  @IsNumber()
  @IsPositive()
  valorInicial: number;

  @IsNumber()
  @Min(0)
  taxaMensal: number; // ex: 1 = 1%

  @IsOptional()
  @IsNumber()
  @Min(0)
  aporteMensal?: number;

  @IsDateString()
  dataInicio: string;
}
