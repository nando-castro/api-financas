import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateCartaoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsNumber()
  @Min(0)
  limite: number;
}
