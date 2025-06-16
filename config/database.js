const path = require('path');
const dotenv = require('dotenv');
const postgres = require('postgres');

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

module.exports = {
  sql,
  config: config[environment]['postgres'],
  isUsingSQLite: false
}; 