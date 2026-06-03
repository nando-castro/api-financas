import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import PDFDocument from 'pdfkit';
import { Repository } from 'typeorm';
import { Financa } from '../financa.entity';

@Injectable()
export class RelatorioFinanceiroService {
  constructor(
    @InjectRepository(Financa)
    private readonly financaRepo: Repository<Financa>,
  ) {}

  async gerarPdf(usuarioId: number, mes: number, ano: number): Promise<Buffer> {
    const inicioMes = dayjs(`${ano}-${mes}-01`).startOf('month').toDate();
    const fimMes = dayjs(inicioMes).endOf('month').toDate();

    const financas = await this.financaRepo
      .createQueryBuilder('financa')
      .leftJoinAndSelect('financa.categoria', 'categoria')
      .where('financa.usuarioId = :usuarioId', { usuarioId })
      .andWhere(
        `
        (
          (financa.dataInicio BETWEEN :inicioMes AND :fimMes)
          OR
          (financa.dataFim IS NOT NULL AND financa.dataFim BETWEEN :inicioMes AND :fimMes)
          OR
          (financa.dataInicio <= :inicioMes AND (financa.dataFim IS NULL OR financa.dataFim >= :fimMes))
        )
        `,
        { inicioMes, fimMes },
      )
      .orderBy('financa.dataInicio', 'ASC')
      .getMany();

    const receitas = financas.filter((f) => f.tipo === 'RENDA');
    const despesas = financas.filter((f) => f.tipo === 'DESPESA');

    const totalReceitas = receitas.reduce((s, r) => s + Number(r.valor), 0);
    const totalDespesas = despesas.reduce((s, d) => s + Number(d.valor), 0);
    const saldo = totalReceitas - totalDespesas;

    const categorias = despesas.reduce(
      (acc, item) => {
        const nome = item.categoria?.nome ?? 'Sem categoria';
        acc[nome] = (acc[nome] || 0) + Number(item.valor);
        return acc;
      },
      {} as Record<string, number>,
    );

    const maiorReceita =
      receitas.length > 0 ? receitas.reduce((a, b) => (a.valor > b.valor ? a : b)) : null;

    const maiorDespesa =
      despesas.length > 0 ? despesas.reduce((a, b) => (a.valor > b.valor ? a : b)) : null;

    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
    });

    const buffers: Buffer[] = [];

    doc.on('data', (buffer) => buffers.push(buffer));

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // Cabeçalho
      doc.fontSize(20).text('RELATÓRIO FINANCEIRO', {
        align: 'center',
      });

      doc.moveDown();

      doc.fontSize(12).text(`${dayjs(`${ano}-${mes}-01`).format('MM/YYYY')}`, { align: 'center' });

      doc.moveDown(2);

      // Resumo
      doc.fontSize(16).text('RESUMO');
      doc.moveDown();

      doc.fontSize(12);
      doc.text(`Receitas: R$ ${totalReceitas.toFixed(2)}`);
      doc.text(`Despesas: R$ ${totalDespesas.toFixed(2)}`);
      doc.text(`Saldo: R$ ${saldo.toFixed(2)}`);

      doc.moveDown(2);

      // Receitas
      doc.fontSize(16).text('RECEITAS');
      doc.moveDown();

      receitas.forEach((r) => {
        doc
          .fontSize(10)
          .text(
            `${dayjs(r.dataInicio).format('DD/MM/YYYY')} | ${r.nome} | ${r.categoria?.nome ?? 'Sem categoria'} | R$ ${Number(r.valor).toFixed(2)}`,
          );
      });

      doc.moveDown(2);

      // Despesas
      doc.fontSize(16).text('DESPESAS');
      doc.moveDown();

      despesas.forEach((d) => {
        doc
          .fontSize(10)
          .text(
            `${dayjs(d.dataInicio).format('DD/MM/YYYY')} | ${d.nome} | ${d.categoria?.nome ?? 'Sem categoria'} | R$ ${Number(d.valor).toFixed(2)}`,
          );
      });

      doc.moveDown(2);

      // Categorias
      doc.fontSize(16).text('DESPESAS POR CATEGORIA');
      doc.moveDown();

      Object.entries(categorias).forEach(([nome, valor]) => {
        doc.text(`${nome}: R$ ${valor.toFixed(2)}`);
      });

      doc.moveDown(2);

      // Indicadores
      doc.fontSize(16).text('INDICADORES');
      doc.moveDown();

      doc.text(`Quantidade de Receitas: ${receitas.length}`);
      doc.text(`Quantidade de Despesas: ${despesas.length}`);

      if (maiorReceita) {
        doc.text(
          `Maior Receita: ${maiorReceita.nome} - R$ ${Number(maiorReceita.valor).toFixed(2)}`,
        );
      }

      if (maiorDespesa) {
        doc.text(
          `Maior Despesa: ${maiorDespesa.nome} - R$ ${Number(maiorDespesa.valor).toFixed(2)}`,
        );
      }

      doc.moveDown(2);

      doc.text(`Relatório emitido em ${dayjs().format('DD/MM/YYYY HH:mm')}`);

      doc.end();
    });
  }
}
