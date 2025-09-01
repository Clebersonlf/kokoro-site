import { sql } from '../_db.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ ok:false, message:'Method not allowed' });
    }
    const { rows } = await sql`SELECT id, nome, email, telefone FROM alunos ORDER BY criado_em DESC LIMIT 1000;`;
    return res.status(200).json({ ok:true, data: rows });
  } catch (e) {
    return res.status(500).json({ ok:false, message:'Erro ao listar alunos', error: String(e) });
  }
}
