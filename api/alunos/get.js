import { sql } from '../_db.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ ok:false, message:'Method not allowed' });
    }
    const id = (req.query?.id || req.query?.ID || '').toString().trim();
    if (!id) return res.status(400).json({ ok:false, message:'id é obrigatório' });

    const { rows } = await sql`SELECT id, nome, email, telefone FROM alunos WHERE id::text = ${id} LIMIT 1;`;
    if (!rows.length) return res.status(404).json({ ok:false, message:'Aluno não encontrado' });
    return res.status(200).json({ ok:true, data: rows[0] });
  } catch (e) {
    return res.status(500).json({ ok:false, message:'Erro ao buscar aluno', error: String(e) });
  }
}
