import { sql } from '../_lib/db';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const result = await sql`
        SELECT COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0) as total
        FROM reserva_caixa
      `;
      
      const reservaTotal = Number(result[0]?.total || 0);
      res.status(200).json({ ok: true, reservaTotal });
    } else {
      res.status(405).json({ ok: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
