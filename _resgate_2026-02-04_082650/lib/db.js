// lib/db.js (ESM) - conexão única com Postgres/Neon via pg
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não definida no ambiente (.env).');
}

// Pool global (reutiliza conexões)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// helper simples
export async function q(text, params) {
  return pool.query(text, params);
}
