import { IsDateString } from 'class-validator';

export class PararAporteDto {
  @IsDateString()
  dataParada: string; // ex: 2026-08-01
}
