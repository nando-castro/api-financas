import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlterarAporteDto } from './dto/alterar-aporte.dto';
import { CreateInvestimentoDto } from './dto/create-investimento.dto';
import { UpdateInvestimentoDto } from './dto/update-investimento.dto';
import { InvestimentoAporte } from './investimento-aporte.entity';
import { Investimento } from './investimento.entity';

@Injectable()
export class InvestimentosService {
  constructor(
    @InjectRepository(Investimento)
    private readonly investimentoRepository: Repository<Investimento>,

    @InjectRepository(InvestimentoAporte)
    private readonly aporteRepository: Repository<InvestimentoAporte>,
  ) {}

  async create(dto: CreateInvestimentoDto, usuarioId: number) {
    const investimento = this.investimentoRepository.create({
      usuarioId,
      nome: dto.nome,
      valorInicial: dto.valorInicial,
      taxaMensal: dto.taxaMensal,
      aporteMensal: dto.aporteMensal ?? 0,
      dataInicio: dto.dataInicio,
    });

    const salvo = await this.investimentoRepository.save(investimento);

    if (Number(dto.aporteMensal ?? 0) > 0) {
      const aporte = this.aporteRepository.create({
        investimentoId: salvo.id,
        valorMensal: Number(dto.aporteMensal),
        dataInicio: this.normalizarInicioMes(dto.dataInicio),
        dataFim: null,
      });

      await this.aporteRepository.save(aporte);
    }

    return salvo;
  }

  async findAll(usuarioId: number) {
    return this.investimentoRepository.find({
      where: { usuarioId },
      relations: { aportes: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, usuarioId: number) {
    const investimento = await this.investimentoRepository.findOne({
      where: { id, usuarioId },
      relations: { aportes: true },
    });

    if (!investimento) {
      throw new NotFoundException('Investimento não encontrado');
    }

    return investimento;
  }

  async update(id: number, dto: UpdateInvestimentoDto, usuarioId: number) {
    await this.findOne(id, usuarioId);

    await this.investimentoRepository.update(
      { id, usuarioId },
      {
        ...(dto.nome !== undefined && { nome: dto.nome }),
        ...(dto.valorInicial !== undefined && { valorInicial: dto.valorInicial }),
        ...(dto.taxaMensal !== undefined && { taxaMensal: dto.taxaMensal }),
        ...(dto.aporteMensal !== undefined && { aporteMensal: dto.aporteMensal }),
        ...(dto.dataInicio !== undefined && { dataInicio: dto.dataInicio }),
      },
    );

    return this.findOne(id, usuarioId);
  }

  async remove(id: number, usuarioId: number) {
    const investimento = await this.findOne(id, usuarioId);
    await this.investimentoRepository.remove(investimento);
    return { message: 'Investimento removido com sucesso' };
  }

  async listarAportes(investimentoId: number, usuarioId: number) {
    await this.findOne(investimentoId, usuarioId);

    return this.aporteRepository.find({
      where: { investimentoId },
      order: { dataInicio: 'ASC' },
    });
  }

  async alterarAporte(investimentoId: number, dto: AlterarAporteDto, usuarioId: number) {
    const investimento = await this.findOne(investimentoId, usuarioId);
    const dataInicio = this.normalizarInicioMes(dto.dataInicio);
    const valorMensal = Number(dto.valorMensal);

    if (dataInicio < investimento.dataInicio) {
      throw new BadRequestException(
        'A data do aporte não pode ser anterior ao início do investimento',
      );
    }

    const aporteAtual = await this.buscarAporteAtivoNaData(investimentoId, dataInicio);

    if (aporteAtual && aporteAtual.dataInicio === dataInicio) {
      aporteAtual.valorMensal = valorMensal;
      await this.aporteRepository.save(aporteAtual);

      investimento.aporteMensal = valorMensal;
      await this.investimentoRepository.save(investimento);

      return {
        message: 'Aporte atualizado com sucesso',
        aporte: aporteAtual,
      };
    }

    if (aporteAtual) {
      aporteAtual.dataFim = this.ultimoDiaMesAnterior(dataInicio);
      await this.aporteRepository.save(aporteAtual);
    }

    const novoAporte = this.aporteRepository.create({
      investimentoId,
      valorMensal,
      dataInicio,
      dataFim: null,
    });

    await this.aporteRepository.save(novoAporte);

    await this.investimentoRepository.update(
      { id: investimentoId, usuarioId },
      { aporteMensal: valorMensal },
    );

    return {
      message: valorMensal === 0 ? 'Aporte zerado com sucesso' : 'Aporte alterado com sucesso',
      aporte: novoAporte,
    };
  }

  async pararAporte(investimentoId: number, dataParada: string, usuarioId: number) {
    const investimento = await this.findOne(investimentoId, usuarioId);
    const referencia = this.normalizarInicioMes(dataParada);

    if (referencia < investimento.dataInicio) {
      throw new BadRequestException(
        'A data de parada não pode ser anterior ao início do investimento',
      );
    }

    const aporteAtual = await this.buscarAporteAtivoNaData(investimentoId, referencia);

    if (!aporteAtual) {
      return { message: 'Nenhum aporte ativo encontrado nessa data' };
    }

    if (aporteAtual.dataInicio === referencia) {
      await this.aporteRepository.remove(aporteAtual);
    } else {
      aporteAtual.dataFim = this.ultimoDiaMesAnterior(referencia);
      await this.aporteRepository.save(aporteAtual);
    }

    await this.investimentoRepository.update(
      { id: investimentoId, usuarioId },
      { aporteMensal: 0 },
    );

    return { message: 'Aporte mensal parado com sucesso' };
  }

  async removerAporteProgramado(investimentoId: number, aporteId: number, usuarioId: number) {
    await this.findOne(investimentoId, usuarioId);

    const aporte = await this.aporteRepository.findOne({
      where: { id: aporteId, investimentoId },
    });

    if (!aporte) {
      throw new NotFoundException('Aporte não encontrado');
    }

    await this.aporteRepository.remove(aporte);

    return { message: 'Aporte futuro removido com sucesso' };
  }

  async resumoPorPeriodo(usuarioId: number, mes: number, ano: number) {
    const investimentos = await this.investimentoRepository.find({
      where: { usuarioId },
      relations: { aportes: true },
      order: { createdAt: 'DESC' },
    });

    return investimentos.map((item) => {
      const valorInicial = Number(item.valorInicial);
      const taxaMensal = Number(item.taxaMensal);

      const calculo = this.calcularProjecao({
        valorInicial,
        taxaMensal,
        dataInicio: item.dataInicio,
        aportes: item.aportes ?? [],
        mes,
        ano,
      });

      return {
        investimentoId: item.id,
        nome: item.nome,
        valorInicial,
        taxaMensal,
        dataInicio: item.dataInicio,
        valorProjetado: calculo.valorProjetado,
        rendimentoAcumulado: calculo.rendimentoAcumulado,
        mesesProjetados: calculo.meses,
        mes,
        ano,
      };
    });
  }

  async simulacaoDetalhada(id: number, mes: number, ano: number, usuarioId: number) {
    const item = await this.findOne(id, usuarioId);

    const valorInicial = Number(item.valorInicial);
    const taxaMensal = Number(item.taxaMensal);

    return this.gerarEvolucaoMensal({
      valorInicial,
      taxaMensal,
      dataInicio: item.dataInicio,
      aportes: item.aportes ?? [],
      mesFinal: mes,
      anoFinal: ano,
    });
  }

  private async buscarAporteAtivoNaData(investimentoId: number, dataReferencia: string) {
    const aportes = await this.aporteRepository.find({
      where: { investimentoId },
      order: { dataInicio: 'DESC' },
    });

    return (
      aportes.find(
        (aporte) =>
          aporte.dataInicio <= dataReferencia &&
          (!aporte.dataFim || aporte.dataFim >= dataReferencia),
      ) ?? null
    );
  }

  private calcularProjecao(params: {
    valorInicial: number;
    taxaMensal: number;
    dataInicio: string;
    aportes: InvestimentoAporte[];
    mes: number;
    ano: number;
  }) {
    const { valorInicial, taxaMensal, dataInicio, aportes, mes, ano } = params;

    const meses = this.calcularQuantidadeMeses(dataInicio, mes, ano);

    let saldo = valorInicial;
    let totalAportes = 0;

    const inicio = this.extrairAnoMes(dataInicio);
    let anoCursor = inicio.ano;
    let mesCursor = inicio.mes;

    for (let i = 0; i < meses; i++) {
      const aporteDoMes = this.obterAporteDoMes(aportes, anoCursor, mesCursor);
      saldo = saldo * (1 + taxaMensal / 100) + aporteDoMes;
      totalAportes += aporteDoMes;

      mesCursor += 1;
      if (mesCursor > 12) {
        mesCursor = 1;
        anoCursor += 1;
      }
    }

    return {
      meses,
      valorProjetado: Number(saldo.toFixed(2)),
      rendimentoAcumulado: Number((saldo - valorInicial - totalAportes).toFixed(2)),
    };
  }

  private gerarEvolucaoMensal(params: {
    valorInicial: number;
    taxaMensal: number;
    dataInicio: string;
    aportes: InvestimentoAporte[];
    mesFinal: number;
    anoFinal: number;
  }) {
    const { valorInicial, taxaMensal, dataInicio, aportes, mesFinal, anoFinal } = params;

    const meses = this.calcularQuantidadeMeses(dataInicio, mesFinal, anoFinal);

    let saldo = valorInicial;
    let totalAportes = 0;

    const historico: Array<{
      referencia: string;
      aporte: number;
      rendimento: number;
      saldo: number;
    }> = [];

    const inicio = this.extrairAnoMes(dataInicio);
    let anoCursor = inicio.ano;
    let mesCursor = inicio.mes;

    historico.push({
      referencia: `${String(mesCursor).padStart(2, '0')}/${anoCursor}`,
      aporte: 0,
      rendimento: 0,
      saldo: Number(saldo.toFixed(2)),
    });

    for (let i = 0; i < meses; i++) {
      const aporteDoMes = this.obterAporteDoMes(aportes, anoCursor, mesCursor);
      const rendimento = saldo * (taxaMensal / 100);

      saldo = saldo + rendimento + aporteDoMes;
      totalAportes += aporteDoMes;

      mesCursor += 1;
      if (mesCursor > 12) {
        mesCursor = 1;
        anoCursor += 1;
      }

      historico.push({
        referencia: `${String(mesCursor).padStart(2, '0')}/${anoCursor}`,
        aporte: Number(aporteDoMes.toFixed(2)),
        rendimento: Number(rendimento.toFixed(2)),
        saldo: Number(saldo.toFixed(2)),
      });
    }

    return {
      valorInicial,
      taxaMensal,
      dataInicio,
      mesFinal,
      anoFinal,
      totalAportes: Number(totalAportes.toFixed(2)),
      valorProjetado: Number(saldo.toFixed(2)),
      historico,
    };
  }

  private obterAporteDoMes(aportes: InvestimentoAporte[], ano: number, mes: number) {
    const referencia = `${ano}-${String(mes).padStart(2, '0')}-01`;

    const aporte = aportes.find(
      (item) => item.dataInicio <= referencia && (!item.dataFim || item.dataFim >= referencia),
    );

    return aporte ? Number(aporte.valorMensal) : 0;
  }

  private extrairAnoMes(data: string) {
    const [ano, mes] = data.split('-').map(Number);
    return { ano, mes };
  }

  private calcularQuantidadeMeses(dataInicio: string, mes: number, ano: number) {
    const inicio = this.extrairAnoMes(dataInicio);
    return Math.max(0, (ano - inicio.ano) * 12 + (mes - inicio.mes) + 1);
  }

  private normalizarInicioMes(data: string) {
    const [ano, mes] = data.split('-').map(Number);
    return `${ano}-${String(mes).padStart(2, '0')}-01`;
  }

  private ultimoDiaMesAnterior(data: string) {
    const [ano, mes] = data.split('-').map(Number);
    const ultimoDia = new Date(Date.UTC(ano, mes - 1, 0));
    return ultimoDia.toISOString().slice(0, 10);
  }
}
