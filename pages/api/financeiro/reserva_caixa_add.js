import { sql } from '../_lib/db';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      const { descricao, valor, tipo, data } = req.body;
      
      if (!descricao || !valor || !tipo || !data) {
        return res.status(400).json({ ok: false, error: 'Dados incompletos' });
      }

      await sql`
        INSERT INTO reserva_caixa (descricao, valor, tipo, data)
        VALUES (${descricao}, ${valor}, ${tipo}, ${data})
      `;
      
      res.status(200).json({ ok: true, message: 'Movimentação registrada' });
    } else {
      res.status(405).json({ ok: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
