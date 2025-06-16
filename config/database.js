import postgres from 'postgres';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:2525@localhost:5432/auth_db';
const sql = postgres(connectionString);

const config = {
  development: {
    postgres: {
      client: 'postgres',
      connection: connectionString,
      migrations: {
        directory: path.join(__dirname, '..', 'migrations')
      }
    }
  }
};

const environment = process.env.NODE_ENV || 'development';

export default {
  sql,
  config: config[environment]['postgres'],
  isUsingSQLite: false
}; 