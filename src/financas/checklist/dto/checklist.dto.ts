import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, Min, ValidateNested } from 'class-validator';

export class ChecklistMensalQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  mes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  ano?: number;
}

export class ChecklistBulkItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  financaId: number;

  @IsBoolean()
  checked: boolean;
}

export class ChecklistBulkUpdateDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  mes: number;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  ano: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistBulkItemDto)
  itens: ChecklistBulkItemDto[];
}
