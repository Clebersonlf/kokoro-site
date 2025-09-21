import { createClient } from '@vercel/postgres';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error('❌ DATABASE_URL/POSTGRES_URL não definida.');
  process.exit(1);
}

const client = createClient({ connectionString: url });

async function main() {
  try {
    console.log('🔌 Conectando no Postgres...');
    await client.connect();

    // cria a tabela se não existir (mesmo schema que usamos na API)
    await client.sql`
      CREATE TABLE IF NOT EXISTS convites (
        id        TEXT PRIMARY KEY,
        token     TEXT UNIQUE NOT NULL,
        email     TEXT NOT NULL,
        nome      TEXT,
        telefone  TEXT,
        status    TEXT NOT NULL DEFAULT 'pendente',
        criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
        usado_em  TIMESTAMPTZ
      );
    `;

    const tot = await client.sql`SELECT COUNT(*)::int AS n FROM convites;`;
    console.log('📦 Total de convites:', tot.rows[0].n);

    const ult = await client.sql`
      SELECT id, email, nome, telefone, status, criado_em
      FROM convites
      ORDER BY criado_em DESC
      LIMIT 5;
    `;
    console.log('🧾 Últimos 5 registros:');
    console.table(ult.rows);
  } catch (e) {
    console.error('❌ Erro:', e?.message || e);
    process.exit(1);
  } finally {
    try { await client.end(); } catch {}
  }
}

main();
