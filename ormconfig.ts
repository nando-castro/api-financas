import { DataSource } from 'typeorm';

//Caso queira rodar migrações
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'app_financas',
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
  synchronize: true,
});
