import { createClient } from '@vercel/postgres';

function withCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

export default async function handler(req, res) {
  if (withCors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  try {
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token') || '';
    if (!token) return res.status(400).json({ ok:false, error:'Informe token' });

    const POOL = process.env.POSTGRES_URL;
    if (!POOL) return res.status(500).json({ ok:false, error:'POSTGRES_URL não definido' });

    const client = createClient({ connectionString: POOL });
    await client.connect();

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
      WHERE token = ${token}
      LIMIT 1;
    `;
    await client.end();

    if (!rows.length) return res.status(404).json({ ok:false, error:'TOKEN_NAO_ENCONTRADO' });
    return res.status(200).json({ ok:true, convite: rows[0] });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  }
}
