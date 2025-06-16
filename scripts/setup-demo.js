const knex = require('knex');
const { config } = require('../config/database');

async function setupDatabase() {
  console.log('Setting up PostgreSQL database...');
  const db = knex(config);
  try {
    // Здесь можно добавить миграции или инициализацию для PostgreSQL, если нужно
    console.log('PostgreSQL database setup completed!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

setupDatabase(); 