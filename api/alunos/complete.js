import { Client } from 'pg';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
}

const ALLOW = [
  'nome','sexo','nome_mae','nome_pai','rg','cpf','data_nascimento','idade',
  'endereco','complemento','bairro','cep','referencia','telefone','whatsapp',
  'email','foto_url','esporte','cor_faixa','peso_kg','altura_m','imc',
  'contato_emerg_nome','contato_emerg_parentesco','contato_emerg_endereco','contato_emerg_telefone',
  'parq_q1','parq_q2','parq_q3','parq_q4','parq_q5','parq_q6','parq_q7','parq_q8',
  'termos_aceitos','lgpd_aceite','status'
];

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) return res.status(500).json({ ok:false, message:'POSTGRES_URL não configurado' });

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized:false } });
  await client.connect();

  try {
    if (req.method === 'GET') {
      const token = String((req.query?.token || '')).trim();
      if (!token) { await client.end(); return res.status(400).json({ ok:false, message:'token ausente' }); }
      const r = await client.query(
        `SELECT id, nome, email, telefone, sexo, nome_mae, nome_pai, rg, cpf,
                data_nascimento, idade, endereco, complemento, bairro, cep, referencia,
                whatsapp, foto_url, esporte, cor_faixa, peso_kg, altura_m, imc,
                contato_emerg_nome, contato_emerg_parentesco, contato_emerg_endereco, contato_emerg_telefone,
                parq_q1, parq_q2, parq_q3, parq_q4, parq_q5, parq_q6, parq_q7, parq_q8,
                termos_aceitos, lgpd_aceite, status, criado_em
           FROM alunos
          WHERE token_cadastro = $1
          LIMIT 1`,
        [token]
      );
      await client.end();
      if (!r.rows.length) return res.status(404).json({ ok:false, message:'Token inválido' });
      return res.status(200).json({ ok:true, aluno: r.rows[0] });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
      const token = String(body.token || '').trim();
      if (!token) { await client.end(); return res.status(400).json({ ok:false, message:'token ausente' }); }

      const updates = [];
      const values  = [];
      let i = 1;
      for (const k of ALLOW) {
        if (body[k] !== undefined) {
          updates.push(`${k} = $${i++}`);
          values.push(body[k]);
        }
      }
      if (!updates.length) { await client.end(); return res.status(400).json({ ok:false, message:'nada para atualizar' }); }

      // Marca como ativo ao completar
      updates.push(`status = 'ativo'`);

      values.push(token);
      const sql = `UPDATE alunos SET ${updates.join(', ')}, criado_em = COALESCE(criado_em, NOW())
                    WHERE token_cadastro = $${i}
                  RETURNING id, nome, email, telefone, status`;
      const r = await client.query(sql, values);
      await client.end();
      if (!r.rowCount) return res.status(404).json({ ok:false, message:'Token inválido' });
      return res.status(200).json({ ok:true, aluno: r.rows[0] });
    }

    await client.end();
    return res.status(405).json({ ok:false, message:'Method not allowed' });
  } catch (e) {
    await client.end();
    return res.status(500).json({ ok:false, message:'Erro no complete', error:String(e) });
  }
}
