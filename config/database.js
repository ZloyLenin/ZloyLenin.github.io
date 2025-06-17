const path = require('path');
<<<<<<< HEAD
const dotenv = require('dotenv');
const postgres = require('postgres');

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:2525@localhost:5432/auth_db';
const sql = postgres(connectionString);
=======
require('dotenv').config();
>>>>>>> parent of c33ff57 (BD)

const config = {
  development: {
    postgres: {
      client: 'pg',
      connection: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      },
      migrations: {
        directory: path.join(__dirname, '..', 'migrations')
      }
    }
  }
};

const environment = process.env.NODE_ENV || 'development';

module.exports = {
<<<<<<< HEAD
  sql,
=======
>>>>>>> parent of c33ff57 (BD)
  config: config[environment]['postgres'],
  isUsingSQLite: false
}; 