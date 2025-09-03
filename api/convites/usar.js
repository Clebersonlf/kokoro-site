import { createClient } from '@vercel/postgres';

function withCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
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
    const { token } = body;
    if (!token) return res.status(400).json({ ok:false, error:'Informe token' });

    const POOL = process.env.POSTGRES_URL;
    if (!POOL) return res.status(500).json({ ok:false, error:'POSTGRES_URL não definido' });

    const client = createClient({ connectionString: POOL });
    await client.connect();

    const upd = await client.sql`
      UPDATE convites
      SET status = 'concluido', usado_em = now()
      WHERE token = ${token} AND status <> 'cancelado'
      RETURNING id, token, email, nome, telefone, status, criado_em, usado_em;
    `;
    await client.end();

    if (!upd.rows.length) {
      return res.status(404).json({ ok:false, error:'TOKEN_NAO_ENCONTRADO_OU_CANCELADO' });
    }
    return res.status(200).json({ ok:true, convite: upd.rows[0] });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  }
}
