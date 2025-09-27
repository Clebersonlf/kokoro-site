import { sql } from '@vercel/postgres';
import { ensureSchema } from '../../_lib/db.js';

export default async function handler(req, res) {
  await ensureSchema();

  if (req.method === 'GET') {
    const { rows } = await sql`select * from alunos order by created_at desc`;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { nome, email, cpf, data_nasc } = req.body || {};
    if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });

    try {
      const { rows } = await sql`
        insert into alunos (nome, email, cpf, data_nasc)
        values (${nome}, ${email || null}, ${cpf || null}, ${data_nasc || null})
        returning *`;
      return res.status(201).json(rows[0]);
    } catch (e) {
      return res.status(400).json({ error: String(e) });
    }
  }

  return res.status(405).json({ error: 'method not allowed' });
}
