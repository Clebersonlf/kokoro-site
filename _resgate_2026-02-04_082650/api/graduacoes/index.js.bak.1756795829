const { query } = require('../_db');

function pad4(n){ return String(n).padStart(4,'0'); }

module.exports = async (req, res) => {
  res.setHeader('Content-Type','application/json; charset=utf-8');

  try {
    if (req.method === 'GET') {
      const { rows } = await query(`
        select g.id, g.grad_numero, g.faixa, g.data_graduacao,
               a.id as aluno_id, a.nome as aluno_nome, a.email as aluno_email
          from graduacoes g
          left join alunos a on a.id = g.aluno_id
         order by g.grad_numero asc nulls last, g.created_at desc
      `);
      return res.status(200).end(JSON.stringify({ ok:true, data:rows }));
    }

    if (req.method === 'POST') {
      const { aluno_id, grad_numero, faixa, data_graduacao } = req.body || {};
      if (!aluno_id) return res.status(400).end(JSON.stringify({ ok:false, message:'aluno_id obrigatório' }));

      let numero = grad_numero;
      if (!numero) {
        const r = await query(`select max(grad_numero) as max from graduacoes`);
        const max = r.rows[0]?.max;
        let n = 74;
        if (max) {
          const cur = parseInt(max, 10);
          if (!Number.isNaN(cur)) n = Math.max(cur + 1, 74);
        }
        numero = pad4(n);
      }

      await query(
        `insert into graduacoes (aluno_id, grad_numero, faixa, data_graduacao)
         values ($1,$2,$3,$4)`,
        [aluno_id, numero, faixa || null, data_graduacao || new Date()]
      );
      return res.status(201).end(JSON.stringify({ ok:true, numero }));
    }

    return res.status(405).end(JSON.stringify({ ok:false, message:'Method not allowed'}));
  } catch (e) {
    console.error(e);
    return res.status(500).end(JSON.stringify({ ok:false, message:'Erro na API de graduações'}));
  }
};
