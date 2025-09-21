import { getClient } from '../../lib/db.js';

function isAdmin(req) {
  const auth = req.headers['x-admin-secret'];
  return auth && process.env.ADMIN_SECRET && auth === process.env.ADMIN_SECRET;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }
  if (!isAdmin(req)) return res.status(401).json({ ok:false, error:'unauthorized' });

  let { matricula_id, percentual_professor, percentual_titular, inicio_vigencia } = req.body || {};
  if (!matricula_id) return res.status(400).json({ ok:false, error:'matricula_id obrigatório' });

  // Regras de preenchimento: se vier só um, o outro é 100 - primeiro
  if (percentual_professor == null && percentual_titular == null) {
    return res.status(400).json({ ok:false, error:'Informe percentual_professor OU percentual_titular' });
  }
  if (percentual_professor == null && percentual_titular != null)
    percentual_professor = 100 - Number(percentual_titular);
  if (percentual_titular == null && percentual_professor != null)
    percentual_titular   = 100 - Number(percentual_professor);

  const a = Number(percentual_professor);
  const b = Number(percentual_titular);
  if ([a,b].some(n => Number.isNaN(n))) {
    return res.status(400).json({ ok:false, error:'Percentuais precisam ser numéricos (aceitam decimais)' });
  }
  if (a < 0 || a > 100 || b < 0 || b > 100) {
    return res.status(400).json({ ok:false, error:'Percentuais devem estar entre 0 e 100' });
  }
  const EPS = 0.01;
  if (Math.abs((a + b) - 100) > EPS) {
    return res.status(400).json({ ok:false, error:'Percentuais devem somar 100 (tolerância 0,01)' });
  }

  const client = getClient();
  await client.connect();
  try {
    await client.sql`
      UPDATE rateio_matricula
         SET fim_vigencia = current_date - 1
       WHERE matricula_id = ${matricula_id}
         AND (fim_vigencia IS NULL OR fim_vigencia >= current_date);
    `;

    const inicio = inicio_vigencia ? new Date(inicio_vigencia) : new Date();
    const { rows } = await client.sql`
      INSERT INTO rateio_matricula (matricula_id, percentual_professor, percentual_titular, inicio_vigencia)
      VALUES (${matricula_id}, ${a}, ${b}, ${inicio})
      RETURNING id, matricula_id, percentual_professor, percentual_titular, inicio_vigencia, fim_vigencia;
    `;
    return res.json({ ok:true, data: rows[0] });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  } finally {
    await client.end();
  }
}
