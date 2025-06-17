<<<<<<< HEAD
const postgres = require('postgres');
=======
const { Pool } = require('pg');
>>>>>>> parent of c33ff57 (BD)

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '2525',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'auth_db'
});

module.exports = {
<<<<<<< HEAD
  query: (text, params) => sql.query(text, params)
=======
  query: (text, params) => pool.query(text, params)
>>>>>>> parent of c33ff57 (BD)
}; 