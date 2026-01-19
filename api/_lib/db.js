import { createPool, createClient } from '@vercel/postgres';

function pickConn() {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

const conn = pickConn();
if (!conn) {
  throw new Error('Falta string de conexão: defina POSTGRES_URL ou DATABASE_URL (ou POSTGRES_URL_NON_POOLING).');
}

const pool = createPool({ connectionString: conn });

export const sql = pool.sql;

export function getDirectClient() {
  const direct =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL;
  if (!direct) throw new Error('Falta string para conexão direta.');
  return createClient({ connectionString: direct });
}
