import { sql } from '../_db.js';

function normBody(body) {
  try { return typeof body === 'string' ? JSON.parse(body||'{}') : (body||{}); }
  catch { return {}; }
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok:false, message:'Method not allowed' });
    }
    const b = normBody(req.body);
    const id = (b.id ?? '').toString().trim();
    if (!id) return res.status(400).json({ ok:false, message:'id é obrigatório' });

    // Apaga (graduacoes/financeiro têm FK ON DELETE CASCADE/SET NULL)
    const { rowCount } = await sql`DELETE FROM alunos WHERE id::text = ${id};`;
    if (!rowCount) return res.status(404).json({ ok:false, message:'Aluno não encontrado para excluir' });
    return res.status(200).json({ ok:true, deleted: id });
  } catch (e) {
    return res.status(500).json({ ok:false, message:'Erro ao excluir aluno', error: String(e) });
  }
}
