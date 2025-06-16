import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:2525@localhost:5432/auth_db';
const sql = postgres(connectionString);

export default sql; 