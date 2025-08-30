const { query } = require('../_db');
module.exports = async (req, res) => {
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if (req.method !== 'GET') return res.status(405).end(JSON.stringify({ ok:false, message:'Method not allowed' }));
  try {
    const sql = `
      select id, coalesce(nome,'(sem nome)') as nome, coalesce(email,'') as email
        from alunos
       order by nome asc nulls last, email asc nulls last
    `;
    const { rows } = await query(sql);
    res.status(200).end(JSON.stringify({ ok:true, data:rows }));
  } catch (e) {
    console.error(e);
    res.status(500).end(JSON.stringify({ ok:false, message:'Erro ao listar alunos' }));
  }
};
