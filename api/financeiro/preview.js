import { getClient } from '../../lib/db.js';
import { calcularSplit } from '../../lib/rateio.js';

export default async function handler(req, res) {
  try {
    const { matricula_id, percentual_professor, percentual_titular, valor } = req.query;

    if (!matricula_id) return res.status(400).json({ ok:false, error:'matricula_id obrigatório' });

    let a = percentual_professor != null ? Number(percentual_professor) : null;
    let b = percentual_titular   != null ? Number(percentual_titular)   : null;

    if (a == null && b == null) return res.status(400).json({ ok:false, error:'informe percentual_professor OU percentual_titular' });
    if (a == null) a = 100 - Number(b);
    if (b == null) b = 100 - Number(a);

    const v = Number(valor ?? 0);
    const client = getClient(); await client.connect();
    const { rows } = await client.sql`
      SELECT p.nome AS plano_nome
        FROM matriculas m
        JOIN planos p ON p.id = m.plano_id
       WHERE m.id = ${matricula_id}
       LIMIT 1;
    `;
    await client.end();

    const split = calcularSplit(v, a, b);
    return res.json({
      ok: true,
      matricula_id,
      plano_nome: rows[0]?.plano_nome ?? null,
      valor_base: v,
      percentuais: { professor: +a.toFixed(2), titular: +b.toFixed(2) },
      split
    });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  }
}
