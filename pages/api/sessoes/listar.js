import { sql } from '../_lib/db.js';
import { exigirAdmin } from '../_lib/kokoro-auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Cookie');
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  const sessao = exigirAdmin(req, res);
  if (!sessao) return;

  try {
    const alunoId = (req.query?.alunoId || '').toString().trim();

    let rows;
    if (alunoId) {
      rows = await sql`
        SELECT *
        FROM sessoes
        WHERE aluno_id::text = ${alunoId}
        ORDER BY data_sessao DESC, created_at DESC
      `;
    } else {
      rows = await sql`
        SELECT *
        FROM sessoes
        ORDER BY data_sessao DESC, created_at DESC
        LIMIT 100
      `;
    }

    return res.status(200).json({ ok: true, sessoes: rows });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      message: 'Erro ao listar sessões',
      error: 'Falha interna'
    });
  }
}
