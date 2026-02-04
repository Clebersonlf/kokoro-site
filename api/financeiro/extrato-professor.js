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
  const professorId = url.searchParams.get('professor_id');
  const from = url.searchParams.get('from'); // YYYY-MM-DD (opcional)
  const to   = url.searchParams.get('to');   // YYYY-MM-DD (opcional)
  if (!professorId) return res.status(400).json({ ok:false, error:'professor_id obrigatório' });

  const client = getClient(); await client.connect();
  try {
    // DEVIDOS a partir dos rateios (valor do professor)
    const devidos = await client.sql`
      SELECT
        pg.id           AS pagamento_id,
        pg.competencia  AS competencia,
        rp.valor_professor,
        rp.percentual_professor,
        rp.regra_usada
      FROM rateios_pagamento rp
      JOIN pagamentos pg  ON pg.id = rp.pagamento_id
      JOIN matriculas m    ON m.id = pg.matricula_id
      WHERE m.professor_id = ${professorId}
        AND (${from}::date IS NULL OR pg.competencia >= ${from}::date)
        AND (${to}::date   IS NULL OR pg.competencia <= ${to}::date)
      ORDER BY pg.competencia ASC;
    `;

    // PAGOS (payouts) ao professor
    const pagos = await client.sql`
      SELECT
        id,
        valor_pago,
        metodo,
        pago_em,
        comprovante_url,
        observacao
      FROM pagamentos_professor
      WHERE professor_id = ${professorId}
        AND (${from}::timestamptz IS NULL OR pago_em::date >= ${from}::date)
        AND (${to}::timestamptz   IS NULL OR pago_em::date <= ${to}::date)
      ORDER BY pago_em DESC;
    `;

    return res.json({ ok:true, devidos: devidos.rows, pagos: pagos.rows });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  } finally {
    await client.end();
  }
}
