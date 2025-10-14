import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Ativa validação automática com os DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ignora campos extras não definidos no DTO
      forbidNonWhitelisted: true, // lança erro se enviar campo desconhecido
      transform: true, // converte tipos automaticamente (ex: string → number)
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
