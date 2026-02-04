import { createClient } from '@vercel/postgres';

// CORS p/ testes locais (WebStorm/localhost)
function withCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

export default async function handler(req, res) {
  if (withCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { nome, email, telefone } = body;

    if (!email) return res.status(400).json({ ok:false, error:'Informe o e-mail' });
    const POOL = process.env.POSTGRES_URL;
    if (!POOL)  return res.status(500).json({ ok:false, error:'POSTGRES_URL não definido' });

    const client = createClient({ connectionString: POOL });
    await client.connect();

    // Tabela básica de convites
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

    const token = Math.random().toString(36).slice(2,10) + Math.random().toString(36).slice(2,10);
    const id    = 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);

    await client.sql`
      INSERT INTO convites (id, token, email, nome, telefone)
      VALUES (${id}, ${token}, ${email}, ${nome || null}, ${telefone || null})
      ON CONFLICT (token) DO NOTHING;
    `;

    await client.end();

    // URL final do cadastro
    const url = `https://www.planckkokoro.com/cadastro/index.html?token=${encodeURIComponent(token)}`;

    return res.status(200).json({ ok:true, token, url });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  }
}
