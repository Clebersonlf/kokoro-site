import { getClient } from '../../lib/db.js';

export default async function handler(req,res){
  if (req.method !== 'GET') {
    res.setHeader('Allow','GET'); return res.status(405).json({ok:false,error:'Method not allowed'});
  }
  const url = new URL(req.url, `https://${req.headers.host}`);
  const from = url.searchParams.get('from');  // ex: 2025-09-01
  const to   = url.searchParams.get('to');    // ex: 2025-12-31
  if (!from || !to) return res.status(400).json({ok:false,error:'from e to são obrigatórios (YYYY-MM-DD)'});

  const client = getClient(); await client.connect();
  try {
    const { rows } = await client.sql`
      SELECT * FROM vw_fin_professor_mes
      WHERE mes BETWEEN ${from}::date AND ${to}::date
      ORDER BY mes ASC, professor_nome ASC;
    `;
    return res.json({ok:true, data: rows});
  } catch(e){
    return res.status(500).json({ok:false,error:String(e)});
  } finally {
    await client.end();
  }
}
