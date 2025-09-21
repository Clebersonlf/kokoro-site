import { createClient } from '@vercel/postgres';

export function getConnString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

export function getClient() {
  const conn = getConnString();
  if (!conn) throw new Error('DATABASE_URL/POSTGRES_URL(_NON_POOLING) não configurada');
  return createClient({ connectionString: conn });
}
