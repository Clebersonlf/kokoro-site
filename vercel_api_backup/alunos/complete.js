import { Client } from 'pg';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
}

const ALLOW = [
  'nome','sexo','nome_mae','nome_pai','mae','pai','rg','cpf','data_nascimento','nascimento','idade',
  'endereco','complemento','bairro','cep','referencia','telefone','whatsapp',
  'email','foto_url','selfie_url','esporte','cor_faixa','faixa','peso_kg','altura_m','imc',
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
        `SELECT
            id, nome, email, telefone, sexo,
            COALESCE(nome_mae, mae) AS nome_mae,
            COALESCE(nome_pai, pai) AS nome_pai,
            rg, cpf,
            COALESCE(data_nascimento, nascimento) AS data_nascimento,
            idade, endereco, complemento, bairro, cep, referencia,
            whatsapp,
            COALESCE(foto_url, selfie_url) AS foto_url,
            esporte,
            COALESCE(cor_faixa, faixa) AS cor_faixa,
            peso_kg, altura_m, imc,
            contato_emerg_nome, contato_emerg_parentesco, contato_emerg_endereco, contato_emerg_telefone,
            parq_q1, parq_q2, parq_q3, parq_q4, parq_q5, parq_q6, parq_q7, parq_q8,
            termos_aceitos, lgpd_aceite, status,
            COALESCE(criado_em, created_at) AS criado_em
           FROM alunos
          WHERE token_cadastro = $1
          LIMIT 1`,
        [token]
      );
      await client.end();
      if (!r.rows.length) return res.status(404).json({ ok:false, message:'Token inválido' });
      const aluno = r.rows[0];

const toBRDate = (d) => {
  if (!d) return null;
  const x = new Date(d);
  const dd = String(x.getDate()).padStart(2, "0");
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const yyyy = x.getFullYear();
  return dd + "/" + mm + "/" + yyyy;
};

const toBRTime = (d) => {
  if (!d) return null;
  const x = new Date(d);
  const hh = String(x.getHours()).padStart(2, "0");
  const mi = String(x.getMinutes()).padStart(2, "0");
  return hh + ":" + mi;
};

const now = new Date();

return res.status(200).json({
  ok: true,
  aluno,
  data_nascimento_br: toBRDate(aluno.data_nascimento),
  hora_nascimento_br: toBRTime(aluno.data_nascimento),
  agora_data_br: toBRDate(now),
  agora_hora_br: toBRTime(now)
});
    }

    if (req.method === 'POST') {

      const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
      const token = String(body.token || '').trim();

        // Converte DD/MM/AAAA para ISO (AAAA-MM-DD) antes de montar o UPDATE
        const brToISODate = (v) => {
          if (v === null || v === undefined) return v;
          if (typeof v !== "string") return v;
          const s = v.trim();
          const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          if (!m) return v;
          const dd = m[1];
          const mm = m[2];
          const yyyy = m[3];
          return yyyy + "-" + mm + "-" + dd;
        };

        if (body.data_nascimento !== undefined) body.data_nascimento = brToISODate(body.data_nascimento);
        if (body.nascimento !== undefined) body.nascimento = brToISODate(body.nascimento);



      if (!token) { await client.end(); return res.status(400).json({ ok:false, message:'token ausente' }); }

      // Compatibilidade: espelha campos duplicados
      function mirror(a, b){
        if (body[a] !== undefined && body[b] === undefined) body[b] = body[a];
      }
      mirror('nome_mae', 'mae');
      mirror('nome_pai', 'pai');
      mirror('foto_url', 'selfie_url');
      mirror('cor_faixa', 'faixa');
      mirror('data_nascimento', 'nascimento');

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
                  RETURNING id, nome, email, telefone, sexo,
                             COALESCE(nome_mae, mae) AS nome_mae,
                             COALESCE(nome_pai, pai) AS nome_pai,
                             rg, cpf,
                             COALESCE(data_nascimento, nascimento) AS data_nascimento,
                             idade, endereco, complemento, bairro, cep, referencia,
                             whatsapp,
                             COALESCE(foto_url, selfie_url) AS foto_url,
                             esporte,
                             COALESCE(cor_faixa, faixa) AS cor_faixa,
                             peso_kg, altura_m, imc,
                             contato_emerg_nome, contato_emerg_parentesco, contato_emerg_endereco, contato_emerg_telefone,
                             parq_q1, parq_q2, parq_q3, parq_q4, parq_q5, parq_q6, parq_q7, parq_q8,
                             termos_aceitos, lgpd_aceite, status,
                             COALESCE(criado_em, created_at) AS criado_em`;
      const r = await client.query(sql, values);
      await client.end();
      if (!r.rowCount) return res.status(404).json({ ok:false, message:'Token inválido' });
      const aluno = r.rows[0];

const toBRDate = (d) => {
  if (!d) return null;
  const x = new Date(d);
  const dd = String(x.getDate()).padStart(2, "0");
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const yyyy = x.getFullYear();
  return dd + "/" + mm + "/" + yyyy;
};

const toBRTime = (d) => {
  if (!d) return null;
  const x = new Date(d);
  const hh = String(x.getHours()).padStart(2, "0");
  const mi = String(x.getMinutes()).padStart(2, "0");
  return hh + ":" + mi;
};

const now = new Date();

return res.status(200).json({
  ok: true,
  aluno,
  data_nascimento_br: toBRDate(aluno.data_nascimento),
  hora_nascimento_br: toBRTime(aluno.data_nascimento),
  agora_data_br: toBRDate(now),
  agora_hora_br: toBRTime(now),
  agora_br: (toBRDate(now) && toBRTime(now)) ? (toBRDate(now) + " " + toBRTime(now)) : null
});
    }

    await client.end();
    return res.status(405).json({ ok:false, message:'Method not allowed' });
  } catch (e) {
    await client.end();
    return res.status(500).json({ ok:false, message:'Erro no complete', error:String(e) });
  }
}
