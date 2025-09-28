import { createClient } from '@vercel/postgres';

/**
 * Regras:
 * - Se existir POSTGRES_URL (pooler) -> usa pooled (createClient() sem options)
 * - Senão, usa conexão direta com DATABASE_URL OU POSTGRES_URL_NON_POOLING (direct: true)
 */
export function getClient() {
  const pooled = process.env.POSTGRES_URL;
  if (pooled) {
    return createClient(); // a lib pega POSTGRES_URL (pooled)
  }

  const direct = process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING;
  if (direct) {
    return createClient({ connectionString: direct, direct: true });
  }

  throw new Error('Sem variáveis de conexão: defina POSTGRES_URL (pooled) ou DATABASE_URL/POSTGRES_URL_NON_POOLING (direta).');
}

/** Teste simples de conectividade */
export async function ping(clientExt) {
  const client = clientExt ?? getClient();
  let mustClose = false;
  if (!clientExt) { await client.connect(); mustClose = true; }
  try {
    await client.sql`select 1 as ok`;
    return true;
  } finally {
    if (mustClose) await client.end();
  }
}
