import { sql } from '../_lib/db.js';

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
    const nome = (b.nome ?? '').toString().trim();
    const email = (b.email ?? '').toString().trim() || null;
    const telefone = (b.telefone ?? '').toString().trim() || null;

    if (!nome) return res.status(400).json({ ok:false, message:'nome é obrigatório' });

    if (id) {
      // UPDATE por id (aceita id uuid ou bigint em texto)
      const { rows } = await sql`
        UPDATE alunos
           SET nome = ${nome}, email = ${email}, telefone = ${telefone}
         WHERE id::text = ${id}
     RETURNING id, nome, email, telefone;`;
      if (!rows.length) return res.status(404).json({ ok:false, message:'Aluno não encontrado para atualizar' });
      return res.status(200).json({ ok:true, data: rows[0], action:'updated' });
    } else {
      // INSERT
      const { rows } = await sql`
        INSERT INTO alunos (nome, email, telefone)
             VALUES (${nome}, ${email}, ${telefone})
          RETURNING id, nome, email, telefone;`;
      return res.status(200).json({ ok:true, data: rows[0], action:'created' });
    }
  } catch (e) {
    // trata unique de email, etc.
    const msg = /duplicate key value/.test(String(e)) ? 'Email já cadastrado' : 'Erro ao salvar aluno';
    return res.status(500).json({ ok:false, message: msg, error: String(e) });
  }
}
