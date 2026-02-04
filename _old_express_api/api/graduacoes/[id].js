import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { query } = require('../_db');

function pad4(s) { return String(s).padStart(4, '0'); }
function isValidNum4(s) { return /^[0-9]{1,4}$/.test(String(s)); }

export default async (req, res) => {
  try {
    const id = (req.query.id || '').trim();
    if (!id) return res.status(400).json({ ok:false, message:'id é obrigatório' });

    if (req.method === 'GET') {
      const sql = `
        select g.id, g.grad_numero, g.faixa, g.data_graduacao,
               a.id as aluno_id, coalesce(a.nome,'(sem nome)') as aluno_nome, coalesce(a.email,'') as aluno_email
          from graduacoes g
          join alunos a on a.id = g.aluno_id
         where g.id = $1
      `;
      const { rows } = await query(sql, [id]);
      if (!rows.length) return res.status(404).json({ ok:false, message:'Não encontrado' });
      return res.status(200).json({ ok:true, data: rows[0] });
    }

    if (req.method === 'PUT') {
      const { grad_numero, faixa, data_graduacao } = req.body || {};
      let numero = grad_numero;
      if (numero != null && numero !== '') {
        if (!isValidNum4(numero)) return res.status(400).json({ ok:false, message:'grad_numero inválido' });
        numero = pad4(numero);
      }
      const sql = `
        update graduacoes
           set grad_numero = coalesce($2, grad_numero),
               faixa = coalesce($3, faixa),
               data_graduacao = coalesce($4, data_graduacao)
         where id = $1
         returning id
      `;
      const params = [id, numero, faixa || null, data_graduacao || null];
      const { rows } = await query(sql, params);
      if (!rows.length) return res.status(404).json({ ok:false, message:'Não encontrado' });
      return res.status(200).json({ ok:true });
    }

    return res.status(405).json({ ok:false, message:'Method not allowed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, message:'Erro na API graduacoes/[id]' });
  }
};
