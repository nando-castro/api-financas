import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // ✅ importa o ConfigModule
import { MailService } from './mail.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // ✅ garante acesso ao .env
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        transport: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
        defaults: {
          from: '"Finanças App" <no-reply@financeiro.com>',
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
