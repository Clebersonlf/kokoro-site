import { getClient } from '../../lib/db.js';

function isAdmin(req) {
  const s = req.headers['x-admin-secret'];
  return s && s === process.env.ADMIN_SECRET;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow','POST'); return res.status(405).json({ok:false,error:'Method not allowed'});
  }
  if (!isAdmin(req)) return res.status(401).json({ok:false,error:'unauthorized'});

  const { professor_id, valor_pago, metodo, pago_em, comprovante_url, observacao } = req.body || {};
  if (!professor_id || valor_pago == null || !metodo) {
    return res.status(400).json({ ok:false, error:'professor_id, valor_pago e metodo são obrigatórios' });
  }

  const client = getClient(); await client.connect();
  try {
    const { rows } = await client.sql`
      INSERT INTO pagamentos_professor (professor_id, valor_pago, metodo, pago_em, comprovante_url, observacao)
      VALUES (${professor_id}, ${Number(valor_pago)}, ${metodo}, ${pago_em ? new Date(pago_em) : new Date()}, ${comprovante_url || null}, ${observacao || null})
      RETURNING id, professor_id, valor_pago, metodo, pago_em, comprovante_url, observacao, criado_em;
    `;
    return res.json({ ok:true, data: rows[0] });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  } finally {
    await client.end();
  }
}
