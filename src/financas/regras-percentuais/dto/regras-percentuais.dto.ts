import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { BasePercentualEnum } from '../regras-percentuais.enums';

export class CriarRegraPercentualDto {
  @IsString()
  nome!: string;

  @IsNumber()
  percentual!: number;

  @IsEnum(BasePercentualEnum)
  basePercentual!: BasePercentualEnum;

  @IsOptional()
  @IsNumber()
  categoriaId?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  mesReferencia?: number;

  @IsOptional()
  @IsNumber()
  anoReferencia?: number;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;
}
