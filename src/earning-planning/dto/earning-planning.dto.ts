import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class EarningPlanningMonthQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2200)
  year: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}

export class CreateDailyEarningPlanningDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  day: number;

  @IsDateString({ strict: true })
  date: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  plannedIncome: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  plannedExpense: number;
}

export class UpdateDailyEarningPlanningDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  plannedIncome: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  plannedExpense: number;
}

export class UpsertMonthlyEarningPlanningDto extends EarningPlanningMonthQueryDto {
  @IsArray()
  @ArrayMaxSize(31)
  @ValidateNested({ each: true })
  @Type(() => CreateDailyEarningPlanningDto)
  days: CreateDailyEarningPlanningDto[];
}

