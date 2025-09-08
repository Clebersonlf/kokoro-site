import { createClient } from '@vercel/postgres';

/**
 * GET /api/convites/ultimos?limit=10
 * Retorna os últimos convites (máx 50).
 */
export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ ok:false, error:'Method not allowed' });
    }

    // parse do limit com cap em 50
    const url = new URL(req.url, `https://${req.headers.host}`);
    const rawLimit = url.searchParams.get('limit') || '10';
    let limit = parseInt(rawLimit, 10);
    if (Number.isNaN(limit) || limit <= 0) limit = 10;
    if (limit > 50) limit = 50;

    const client = createClient();
    await client.connect();

    const { rows } = await client.sql`
      SELECT
        id, token, email, nome, telefone, status, criado_em, usado_em
      FROM convites
      ORDER BY criado_em DESC
      LIMIT ${limit};
    `;

    return res.status(200).json({ ok:true, count: rows.length, data: rows });
  } catch (e) {
    console.error('ultimos error:', e);
    return res.status(500).json({ ok:false, error: String(e) });
  }
}
