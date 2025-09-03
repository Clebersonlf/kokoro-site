import { createClient } from '@vercel/postgres';

// CORS simples (permite teste pelo navegador/local)
function withCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

export default async function handler(req, res) {
  if (withCors(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  try {
    // lê ?limit= (padrão 10, máximo 50)
    let limit = 10;
    try {
      const url = new URL(req.url, 'http://localhost');
      const ql = parseInt(url.searchParams.get('limit') || '10', 10);
      if (!Number.isNaN(ql)) limit = Math.min(50, Math.max(1, ql));
    } catch {}

    const POOL = process.env.POSTGRES_URL;
    if (!POOL) return res.status(500).json({ ok:false, error:'POSTGRES_URL não definido' });

    const client = createClient({ connectionString: POOL });
    await client.connect();

    // Tabela idempotente (só pra garantir que não quebre se ainda não existir)
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

    const { rows } = await client.sql`
      SELECT id, token, email, nome, telefone, status, criado_em, usado_em
      FROM convites
      ORDER BY criado_em DESC NULLS LAST
      LIMIT ${limit};
    `;

    await client.end();
    return res.status(200).json({ ok:true, data: rows });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  }
}
