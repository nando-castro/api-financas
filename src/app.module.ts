import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CategoriasModule } from './categorias/categorias.module';
import { FinancasModule } from './financas/financas.module';
import { MailModule } from './mail/mail.module';
import { UsuariosModule } from './usuarios/usuarios.module';

const isProduction = process.env.AMBIENTE === 'prod';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'postgres',
      database: process.env.DB_NAME || 'app_financas',
      autoLoadEntities: true,
      synchronize: true,
      ssl: isProduction
        ? { rejectUnauthorized: false } // se usar banco em nuvem (como Render, Supabase, Neon)
        : false, // se local
    }),
    UsuariosModule,
    AuthModule,
    CategoriasModule,
    FinancasModule,
    MailModule,
  ],
})
export class AppModule {}
