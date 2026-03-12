import { PartialType } from '@nestjs/mapped-types';
import { CreateInvestimentoDto } from './create-investimento.dto';

export class UpdateInvestimentoDto extends PartialType(CreateInvestimentoDto) {}
