import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { BasePercentualEnum } from '../regras-percentuais.enums';

export class AtualizarRegraPercentualDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentual?: number;

  @IsOptional()
  @IsEnum(BasePercentualEnum)
  basePercentual?: BasePercentualEnum;

  @IsOptional()
  @IsNumber()
  categoriaId?: number;
}
