import { sql } from '@vercel/postgres';

/**
 * Cria/garante as tabelas necessárias.
 * Usa gen_random_uuid(); tenta habilitar pgcrypto (ignora erro se não puder).
 */
export async function ensureSchema() {
  try { await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`; } catch (_) {}

  // Alunos
  await sql`
    CREATE TABLE IF NOT EXISTS alunos (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      nome        text NOT NULL,
      email       text UNIQUE,
      cpf         text,
      data_nasc   date,
      created_at  timestamptz DEFAULT now()
    );
  `;

  // Graduações (controle de numeração incluído: "numero")
  await sql`
    CREATE TABLE IF NOT EXISTS graduacoes (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      aluno_id    uuid REFERENCES alunos(id) ON DELETE CASCADE,
      modalidade  text NOT NULL,    -- ex: jiu-jitsu
      nivel       text NOT NULL,    -- ex: faixa/nível
      numero      integer,          -- seu controle de numeração
      data        date,
      created_at  timestamptz DEFAULT now()
    );
  `;

  // Financeiro
  await sql`
    CREATE TABLE IF NOT EXISTS financeiro_lancamentos (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      aluno_id    uuid REFERENCES alunos(id) ON DELETE SET NULL,
      tipo        text NOT NULL,    -- "receita" | "despesa"
      valor       numeric(12,2) NOT NULL,
      descricao   text,
      data        date,
      created_at  timestamptz DEFAULT now()
    );
  `;

  // Índices úteis
  try { await sql`CREATE INDEX IF NOT EXISTS idx_alunos_created ON alunos(created_at DESC);`; } catch (_){}
  try { await sql`CREATE INDEX IF NOT EXISTS idx_grad_created ON graduacoes(created_at DESC);`; } catch (_){}
  try { await sql`CREATE INDEX IF NOT EXISTS idx_fin_data_created ON financeiro_lancamentos(data DESC, created_at DESC);`; } catch (_){}
}
