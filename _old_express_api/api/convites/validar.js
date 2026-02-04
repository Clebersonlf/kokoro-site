// api/convites/validar.js
import { createClient } from '@vercel/postgres';

function getConnString() {
  return (
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL
  );
}

/**
 * GET /api/convites/validar?token=XYZ
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  const conn = getConnString();
  if (!conn) {
    return res.status(500).json({
      ok:false,
      error:'DATABASE_URL/POSTGRES_URL/POSTGRES_URL_NON_POOLING não configurada'
    });
  }

  const token = (req.query.token || '').trim();
  if (!token) {
    return res.status(400).json({ ok:false, error:'Informe ?token=' });
  }

  const client = createClient({ connectionString: conn });

  try {
    await client.connect();
    const { rows } = await client.sql`
      SELECT id, token, email, nome, telefone, status, criado_em, usado_em
      FROM convites
      WHERE token = ${token}
      LIMIT 1;
    `;
    if (rows.length === 0) {
      return res.status(404).json({ ok:false, valid:false, reason:'nao_encontrado' });
    }
    const c = rows[0];
    const valid = !c.status || c.status === 'pendente';
    return res.status(200).json({
      ok:true,
      valid,
      reason: valid ? 'ok' : 'ja_usado',
      data: c
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok:false, error:String(e) });
  } finally {
    try { await client.end(); } catch {}
  }
}
import { createClient } from '@vercel/postgres';

function getConnString() {
  return (
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL
  );
}

/**
 * GET /api/convites/validar?token=XYZ
 * Retorna os dados do convite sem marcá-lo como usado.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const token = (url.searchParams.get('token') || '').trim();

    if (!token) {
      return res.status(400).json({ ok:false, error:'Parâmetro "token" é obrigatório' });
    }

    const conn = getConnString();
    if (!conn) {
      return res.status(500).json({
        ok:false,
        error:'DATABASE_URL/POSTGRES_URL/POSTGRES_URL_NON_POOLING não configurada'
      });
    }

    const client = createClient({ connectionString: conn });
    await client.connect();

    const { rows } = await client.sql`
      SELECT id, token, email, nome, telefone, status, criado_em, usado_em
      FROM convites
      WHERE token = ${token}
      LIMIT 1;
    `;

    await client.end();

    if (rows.length === 0) {
      return res.status(404).json({ ok:false, error:'Convite não encontrado' });
    }

    return res.status(200).json({ ok:true, convite: rows[0] });
  } catch (e) {
    return res.status(500).json({ ok:false, error: String(e) });
  }
}
