import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async enviarEmailRecuperacao(email: string, nome: string, token: string) {
    const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Redefinição de senha - Finanças App',
        html: `
          <p>Olá <strong>${nome}</strong>,</p>
          <p>Você solicitou uma redefinição de senha. Clique abaixo:</p>
          <a href="${link}" target="_blank">Redefinir senha</a>
          <p>Esse link expira em 1 hora.</p>
        `,
      });

      this.logger.log(`📧 E-mail enviado para ${email}`);
      return { message: 'E-mail enviado com sucesso' };
    } catch (error) {
      this.logger.error('❌ Erro ao enviar e-mail:', error);
      throw error; // repassa o erro pro Nest mostrar no console
    }
  }
}
