import { sql as pooledSql, createClient } from '@vercel/postgres';

export const sql = pooledSql;

export function getDirectClient() {
  const direct = process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING;
  if (!direct) throw new Error('Falta DATABASE_URL/POSTGRES_URL_NON_POOLING para conexão direta.');
  return createClient({ connectionString: direct, direct: true });
}
