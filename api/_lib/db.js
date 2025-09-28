import { createClient } from '@vercel/postgres';

/**
 * Retorna um client de Postgres que funciona em dois cenários:
 * - Se houver POSTGRES_URL (pool) -> usa pooled (recomendado pela Vercel)
 * - Caso contrário, se houver apenas DATABASE_URL (direto) -> usa conexão direta
 */
export function getClientAuto() {
  const pooled = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_PRISMA_URL;
  if (pooled) {
    // pooled padrão da Vercel (@vercel/postgres detecta sozinho)
    return createClient();
  }
  const direct = process.env.DATABASE_URL;
  if (direct) {
    // força modo direto quando só existe DATABASE_URL (neon direto)
    return createClient({ connectionString: direct, direct: true });
  }
  throw new Error('Nenhuma variável de conexão encontrada (POSTGRES_URL ou DATABASE_URL).');
}
