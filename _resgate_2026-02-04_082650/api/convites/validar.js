// api/convites/validar.js
import { sql } from '../_lib/db.js';

/**
 * GET /api/convites/validar?token=XYZ
 * Retorna os dados do convite sem marcá-lo como usado.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  try {
    const token = (req.query?.token || '').toString().trim();
    if (!token) {
      return res.status(400).json({ ok:false, error:'Parâmetro "token" é obrigatório' });
    }

    // Neon: retorna ARRAY de linhas
    const rows = await sql`
      SELECT id, token, email, nome, telefone, status, criado_em, usado_em
      FROM convites
      WHERE token = ${token}
      LIMIT 1;
    `;

    if (!rows.length) {
      return res.status(404).json({ ok:false, valid:false, reason:'nao_encontrado' });
    }

    const c = rows[0];
    const valid = !c.status || c.status === 'pendente';

    return res.status(200).json({
      ok:true,
      valid,
      reason: valid ? 'ok' : 'ja_usado',
      convite: c
    });
  } catch (e) {
    console.error('[convites/validar] erro:', e);
    return res.status(500).json({ ok:false, error: String(e) });
  }
}
