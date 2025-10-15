import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Categoria } from './src/categorias/categoria.entity';
import { Financa } from './src/financas/financa.entity';
import { Usuario } from './src/usuarios/usuario.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: true,
  entities: [Usuario, Categoria, Financa],
  migrations: ['src/migrations/*.ts'],
});
