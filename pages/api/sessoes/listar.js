import { sql } from '../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

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
      error: String(e)
    });
  }
}
