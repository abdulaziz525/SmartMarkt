import knex from 'knex';
import dotenv from 'dotenv';
dotenv.config();

const dbType = (process.env.DB_TYPE || 'postgres').toLowerCase();

const config = {
  client: dbType === 'mysql' ? 'mysql2' : 'pg',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || (dbType === 'mysql' ? 'root' : 'postgres'),
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smartmarkt',
    port: Number(process.env.DB_PORT) || (dbType === 'mysql' ? 3306 : 5432),
  },
  useNullAsDefault: true,
};

export const db = knex(config);
export { dbType };
