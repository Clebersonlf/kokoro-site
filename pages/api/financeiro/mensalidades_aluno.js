import { sql } from '../_lib/db.js';

export default async function handler(req, res) {
  try {
    const aluno_id = String(req.query.aluno_id || '').trim();

    if (!aluno_id) {
      return res.status(400).json({ ok: false, error: 'aluno_id obrigatório' });
    }

    const rows = await sql`
      SELECT
        id,
        referencia,
        descricao,
        valor,
        vencimento,
        data_pagamento,
        status,
        forma_pagamento,
        observacoes
      FROM mensalidades_alunos
      WHERE aluno_id = ${aluno_id}
      ORDER BY COALESCE(vencimento, created_at) DESC
      LIMIT 12
    `;

    return res.status(200).json({ ok: true, mensalidades: rows });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
