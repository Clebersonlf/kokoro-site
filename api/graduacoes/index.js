import { sql } from '@vercel/postgres';
import { ensureSchema } from '../_lib/db.js';

export default async function handler(req, res) {
  await ensureSchema();

  if (req.method === 'GET') {
    const { rows } = await sql`select * from graduacoes order by created_at desc`;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { aluno_id, modalidade, nivel, numero, data } = req.body || {};
    if (!aluno_id || !modalidade || !nivel) {
      return res.status(400).json({ error: 'aluno_id, modalidade e nivel são obrigatórios' });
    }

    const { rows } = await sql`
      insert into graduacoes (aluno_id, modalidade, nivel, numero, data)
      values (${aluno_id}, ${modalidade}, ${nivel}, ${numero || null}, ${data || null})
      returning *`;
    return res.status(201).json(rows[0]);
  }

  return res.status(405).json({ error: 'method not allowed' });
}
