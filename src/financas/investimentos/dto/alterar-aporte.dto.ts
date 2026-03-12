import { IsDateString, IsNumber, Min } from 'class-validator';

export class AlterarAporteDto {
  @IsNumber()
  @Min(0)
  valorMensal: number;

  @IsDateString()
  dataInicio: string; // ex: 2026-05-01
}
