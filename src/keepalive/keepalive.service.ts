import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class KeepAliveService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KeepAliveService.name);
  private intervalId: NodeJS.Timeout | null = null;

  onModuleInit() {
    this.startKeepAlive();
  }

  onModuleDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private startKeepAlive() {
    const url = process.env.RENDER_URL || 'https://api-financas.onrender.com';
    const interval = 10 * 60 * 1000; // 10 minutos

    this.logger.log(`⏱️ Rotina KeepAlive iniciada para ${url}`);

    this.intervalId = setInterval(() => {
      (async () => {
        // Converte hora UTC → hora de Brasília (UTC-3)
        const horaUTC = new Date().getUTCHours();
        const horaBrasilia = (horaUTC + 21) % 24;

        // Executa apenas entre 10h e 22h (horário de Brasília)
        if (horaBrasilia >= 10 && horaBrasilia < 22) {
          try {
            await axios.get(url);
            this.logger.log(`[${new Date().toLocaleTimeString()}] ✅ Ping enviado com sucesso.`);
          } catch (err) {
            this.logger.error(`❌ Erro ao enviar ping: ${err.message}`);
          }
        }
      })();
    }, interval);
  }
}
