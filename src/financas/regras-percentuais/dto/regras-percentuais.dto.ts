import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { BasePercentualEnum } from '../regras-percentuais.enums';

export class CriarRegraPercentualDto {
  @IsString()
  nome: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  percentual: number;

  @IsEnum(BasePercentualEnum)
  basePercentual: BasePercentualEnum;

  @IsOptional()
  @IsNumber()
  categoriaId?: number;
}
