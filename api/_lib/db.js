import { createClient } from '@vercel/postgres';

let _client;

/**
 * Devolve um client conectado usando POSTGRES_URL ou DATABASE_URL
 * (funciona tanto para URL direta quanto para pool).
 */
export async function getClient() {
  if (_client) return _client;
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Faltam as variáveis POSTGRES_URL ou DATABASE_URL.');
  }
  _client = createClient({ connectionString });
  await _client.connect();
  return _client;
}

/** atalho: usa tagged template `sql` igual à lib original */
export async function sql(strings, ...values) {
  const c = await getClient();
  return c.sql(strings, ...values);
}

/** cria o schema se não existir */
export async function ensureSchema() {
  const c = await getClient();

  // Extensão (ignora erro se não puder criar em ambiente gerenciado)
  try { await c.sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`; } catch {}

  await c.sql`
    CREATE TABLE IF NOT EXISTS alunos (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      nome        text NOT NULL,
      email       text UNIQUE,
      cpf         text,
      data_nasc   date,
      created_at  timestamptz DEFAULT now()
    );
  `;

  await c.sql`
    CREATE TABLE IF NOT EXISTS graduacoes (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      aluno_id    uuid REFERENCES alunos(id) ON DELETE CASCADE,
      modalidade  text NOT NULL,
      nivel       text NOT NULL,
      numero      integer,
      data        date,
      created_at  timestamptz DEFAULT now()
    );
  `;

  await c.sql`
    CREATE TABLE IF NOT EXISTS financeiro_lancamentos (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      aluno_id    uuid REFERENCES alunos(id) ON DELETE SET NULL,
      tipo        text NOT NULL,            -- 'receita' | 'despesa'
      valor       numeric(12,2) NOT NULL,
      descricao   text,
      data        date,
      created_at  timestamptz DEFAULT now()
    );
  `;
}
