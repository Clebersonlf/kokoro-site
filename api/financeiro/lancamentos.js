import { sql, ensureSchema } from '../../_lib/db.js';

export default async function handler(req, res) {
  await ensureSchema();

  if (req.method === 'GET') {
    const { rows } = await sql`
      select * from financeiro_lancamentos
      order by data desc nulls last, created_at desc`;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { aluno_id, tipo, valor, descricao, data } = req.body || {};
    if (!tipo || !valor) return res.status(400).json({ error: 'tipo e valor são obrigatórios' });

    const { rows } = await sql`
      insert into financeiro_lancamentos (aluno_id, tipo, valor, descricao, data)
      values (${aluno_id || null}, ${tipo}, ${valor}, ${descricao || null}, ${data || null})
      returning *`;
    return res.status(201).json(rows[0]);
  }

  return res.status(405).json({ error: 'method not allowed' });
}
