import { createClient } from '@vercel/postgres';

export function getClient() {
  const client = createClient();
  return client;
}

/** Garante extensões e tabelas necessárias. Aceita client injetado. */
export async function ensureSchema(clientExt) {
  const client = clientExt ?? getClient();
  let mustClose = false;
  if (!clientExt) { await client.connect(); mustClose = true; }

  try {
    // extensão para gen_random_uuid(); se não puder, ignora erro
    try { await client.sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`; } catch {}

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
