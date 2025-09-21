import { getClient } from '../../lib/db.js';

function isAdmin(req) {
  const s = req.headers['x-admin-secret'];
  return s && s === process.env.ADMIN_SECRET;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow','GET'); return res.status(405).json({ok:false,error:'Method not allowed'});
  }
  if (!isAdmin(req)) return res.status(401).json({ok:false,error:'unauthorized'});

  const url = new URL(req.url, `https://${req.headers.host}`);
  const professorId = url.searchParams.get('professor_id') || null;

  const client = getClient(); await client.connect();
  try {
    if (professorId) {
      const { rows } = await client.sql`
        SELECT * FROM vw_saldo_professor WHERE professor_id = ${professorId} LIMIT 1;
      `;
      return res.json({ ok:true, data: rows[0] || null });
    } else {
      const { rows } = await client.sql`
        SELECT * FROM vw_saldo_professor ORDER BY professor_nome ASC;
      `;
      return res.json({ ok:true, data: rows });
    }
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  } finally {
    await client.end();
  }
}
