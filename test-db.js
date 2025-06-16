const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '2525',
  host: 'localhost',
  port: 5432,
  database: 'auth_db'
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL');
    
    // Проверяем существование таблицы users
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    console.log('Table users exists:', result.rows[0].exists);
    
    client.release();
  } catch (err) {
    console.error('Database connection error:', err);
  } finally {
    await pool.end();
  }
}

testConnection(); 