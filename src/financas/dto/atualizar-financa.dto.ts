import { PartialType } from '@nestjs/mapped-types';
import { CriarFinancaDto } from './criar-financa.dto';

export class AtualizarFinancaDto extends PartialType(CriarFinancaDto) {}
