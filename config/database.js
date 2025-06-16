const path = require('path');
require('dotenv').config();

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
  config: config[environment]['postgres'],
  isUsingSQLite: false
}; 