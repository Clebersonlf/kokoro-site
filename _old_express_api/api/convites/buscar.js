import { createClient } from '@vercel/postgres';

/**
 * GET /api/convites/buscar?email=fragmento&limit=10
 * Busca por e-mail (contém, case-insensitive). Máx 50 resultados.
 */
export default async function handler(req, res) {
  let client;
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ ok:false, error:'Method not allowed' });
    }

    const url = new URL(req.url, `https://${req.headers.host}`);
    const q = (url.searchParams.get('email') || '').trim();
    if (!q) {
      return res.status(400).json({ ok:false, error:'Parâmetro "email" é obrigatório' });
    }

    const rawLimit = url.searchParams.get('limit') || '10';
    let limit = parseInt(rawLimit, 10);
    if (Number.isNaN(limit) || limit <= 0) limit = 10;
    if (limit > 50) limit = 50;

    const conn =
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL;

    if (!conn) {
      return res.status(500).json({
        ok:false,
        error:'Sem connection string: defina POSTGRES_URL_NON_POOLING ou POSTGRES_URL ou DATABASE_URL'
      });
    }

    client = createClient({ connectionString: conn });
    await client.connect();

    // ILIKE para busca case-insensitive por "contém"
    const { rows } = await client.sql`
      SELECT id, token, email, nome, telefone, status, criado_em, usado_em
      FROM convites
      WHERE email ILIKE ${'%' + q + '%'}
      ORDER BY criado_em DESC
      LIMIT ${limit};
    `;

    return res.status(200).json({ ok:true, count: rows.length, data: rows });
  } catch (e) {
    console.error('buscar error:', e);
    return res.status(500).json({ ok:false, error: String(e) });
  } finally {
    try { await client?.end(); } catch {}
  }
}
