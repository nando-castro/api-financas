import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class KeepAliveService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KeepAliveService.name);
  private intervalId: NodeJS.Timeout | null = null;
  private lastPing: Date | null = null;

  private readonly url = process.env.RENDER_URL || 'https://api-financas.onrender.com';
  private readonly interval = 10 * 60 * 1000; // 10 minutos
  private readonly enabled = process.env.KEEPALIVE_ENABLED === 'true'; // ativar/desativar via .env

  onModuleInit() {
    if (this.enabled) {
      this.startKeepAlive();
    } else {
      this.logger.warn('⚠️ Rotina KeepAlive desativada via configuração (.env).');
    }
  }

  onModuleDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private startKeepAlive() {
    this.logger.log(`⏱️ Rotina KeepAlive iniciada para ${this.url}`);

    this.intervalId = setInterval(() => {
      (async () => {
        const agora = new Date();
        const horaUTC = agora.getUTCHours();
        const diaSemana = agora.getUTCDay(); // 0 = domingo, 6 = sábado
        const horaBrasilia = (horaUTC + 21) % 24; // converte UTC → UTC-3

        const diaUtil = diaSemana >= 1 && diaSemana <= 5; // segunda a sexta
        const horarioAtivo = horaBrasilia >= 10 && horaBrasilia < 22;

        if (diaUtil && horarioAtivo) {
          try {
            await axios.get(this.url);
            this.lastPing = new Date();
            this.logger.log(`[${this.lastPing.toLocaleTimeString()}] ✅ Ping enviado com sucesso.`);
          } catch (err) {
            this.logger.error(`❌ Erro ao enviar ping: ${err.message}`);
          }
        }
      })();
    }, this.interval);
  }

  getStatus() {
    const agora = new Date();
    const horaUTC = agora.getUTCHours();
    const diaSemana = agora.getUTCDay();
    const horaBrasilia = (horaUTC + 21) % 24;

    const ativo =
      this.enabled && diaSemana >= 1 && diaSemana <= 5 && horaBrasilia >= 10 && horaBrasilia < 22;

    const proximoPing = this.lastPing ? new Date(this.lastPing.getTime() + this.interval) : null;

    return {
      url: this.url,
      ativo,
      habilitado: this.enabled,
      diaSemana: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][diaSemana],
      fusoHorario: 'America/Sao_Paulo (UTC-3)',
      horaAtual: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      ultimaExecucao: this.lastPing
        ? this.lastPing.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        : 'Ainda não executado',
      proximoPing: proximoPing
        ? proximoPing.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        : 'Aguardando primeiro ciclo',
      intervaloMinutos: this.interval / 60000,
    };
  }
}
