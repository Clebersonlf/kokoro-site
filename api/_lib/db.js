import { createClient } from '@vercel/postgres';

/** Retorna um client do Postgres (usa var de ambiente da Vercel). */
export function getClient() {
  return createClient(); // autodetecta DATABASE_URL/POSTGRES_URL
}

/** Garante extensões e tabelas necessárias. Aceita client injetado. */
export async function ensureSchema(clientExt) {
  const client = clientExt ?? getClient();
  let mustClose = false;
  if (!clientExt) { await client.connect(); mustClose = true; }

  try {
    // Tenta habilitar extensão p/ gen_random_uuid(); se falhar, ignora
    try { await client.sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`; } catch {}

    // ---- Alunos
    await client.sql`
      CREATE TABLE IF NOT EXISTS alunos (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        nome        text NOT NULL,
        email       text UNIQUE,
        cpf         text,
        data_nasc   date,
        created_at  timestamptz DEFAULT now()
      );
    `;

    // ---- Lançamentos financeiros
    await client.sql`
      CREATE TABLE IF NOT EXISTS financeiro_lancamentos (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        aluno_id    uuid REFERENCES alunos(id) ON DELETE SET NULL,
        tipo        text NOT NULL,          -- 'receita' | 'despesa'
        valor       numeric(12,2) NOT NULL,
        descricao   text,
      data        date,
        created_at  timestamptz DEFAULT now()
      );
    `;
  } finally {
    if (mustClose) await client.end();
  }
}
