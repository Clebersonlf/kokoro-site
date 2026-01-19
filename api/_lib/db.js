import { createPool, createClient } from '@vercel/postgres';

const pool = createPool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
});

export const sql = pool.sql;

export function getDirectClient() {
  const direct = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
  if (!direct) throw new Error('Falta POSTGRES_URL_NON_POOLING/DATABASE_URL para conexão direta.');
  return createClient({ connectionString: direct });
}
