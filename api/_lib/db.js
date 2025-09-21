import { sql } from '@vercel/postgres';

/**
 * Garante as tabelas necessárias.
 * Usa gen_random_uuid() – em Postgres gerenciado costuma já vir habilitado.
 * Se precisar, ative a extensão pgcrypto no seu banco.
 */
export async function ensureSchema() {
  // Tenta ativar extensão (ignora erro se já estiver ativa ou não for permitida)
  try { await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`; } catch (_) {}

  await sql`
    CREATE TABLE IF NOT EXISTS alunos (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      nome        text NOT NULL,
      email       text,
      cpf         text,
      data_nasc   date,
      created_at  timestamptz DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS graduacoes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      aluno_id    uuid REFERENCES alunos(id) ON DELETE CASCADE,
      modalidade  text NOT NULL,     -- jiu-jitsu etc.
      nivel       text NOT NULL,     -- faixa/numeração
      numero      integer,           -- seu controle de numeração
      data        date,
      created_at  timestamptz DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS financeiro_lancamentos (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      aluno_id  uuid REFERENCES alunos(id) ON DELETE SET NULL,
      tipo      text NOT NULL,       -- receita | despesa
      valor     numeric(12,2) NOT NULL,
      descricao text,
      data      date,
      created_at timestamptz DEFAULT now()
    );
  `;
}
