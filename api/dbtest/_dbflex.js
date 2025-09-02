import { createClient } from '@vercel/postgres';

/**
 * Abre uma conexão flexível:
 * - Usa POSTGRES_URL (pooled) se existir
 * - Senão usa DATABASE_URL (direta)
 * Funciona com as duas.
 */
export async function getClient() {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) throw new Error('NO_DB_URL');
  const client = createClient({ connectionString: url });
  await client.connect();
  return client;
}
