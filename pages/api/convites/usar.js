// pages/api/convites/usar.js
import { sql } from '../_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  let origemPermitida;
  try {
    origemPermitida = new URL(process.env.KOKORO_APP_ORIGIN).origin;
  } catch {
    return res.status(503).json({ ok:false, error:'Origem nao configurada' });
  }

  if (req.headers.origin !== origemPermitida) {
    return res.status(403).json({ ok:false, error:'Origem nao autorizada' });
  }

  try {
    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body || '{}')
        : (req.body || {});

    const token = (body?.token || '').toString().trim();

    if (!token || token.length > 512) {
      return res.status(400).json({ ok:false, error:'Informe token' });
    }

    const atualizado = await sql`
      UPDATE convites
      SET status = 'concluido',
          usado_em = NOW()
      WHERE token = ${token}
        AND (status IS NULL OR status = 'pendente')
        AND (expira_em IS NULL OR expira_em > NOW())
      RETURNING id;
    `;

    if (!atualizado.length) {
      return res.status(400).json({
        ok:false,
        error:'TOKEN_INVALIDO_USADO_OU_EXPIRADO'
      });
    }

    return res.status(200).json({ ok:true });

  } catch (e) {
    return res.status(500).json({
      ok:false,
      error:'Falha interna ao concluir convite'
    });
  }
}
