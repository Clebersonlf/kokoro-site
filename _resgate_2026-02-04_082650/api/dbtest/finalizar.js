import { createClient } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  try {
    // usa SEMPRE a conexão pooled
    const POOL = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!POOL) return res.status(500).json({ ok:false, error:'DB URL não definida' });

    const client = createClient({ connectionString: POOL });
    await client.connect();

    const body = typeof req.body === 'string'
      ? JSON.parse(req.body || '{}')
      : (req.body || {});
    const { token, nome, email, telefone, whatsapp, endereco, nascimento, observacoes } = body;

    if (!token)  return res.status(400).json({ ok:false, error:'Falta token' });
    if (!nome)   return res.status(400).json({ ok:false, error:'Falta nome' });
    if (!email)  return res.status(400).json({ ok:false, error:'Falta email' });

    // UPSERT somente nas colunas de dados; NÃO cita 'id'
    const { rows } = await client.sql`
      INSERT INTO alunos (nome, email, telefone, whatsapp, endereco, nascimento, observacoes)
      VALUES (
        ${nome},
        ${email},
        ${telefone || null},
        ${whatsapp || null},
        ${endereco || null},
        ${nascimento || null},
        ${observacoes || null}
      )
      ON CONFLICT (email) DO UPDATE
      SET nome = EXCLUDED.nome,
          telefone = EXCLUDED.telefone,
          whatsapp = EXCLUDED.whatsapp,
          endereco = EXCLUDED.endereco,
          nascimento = EXCLUDED.nascimento,
          observacoes = EXCLUDED.observacoes
      RETURNING id, nome, email, telefone, whatsapp, endereco, nascimento, observacoes, criado_em;
    `;

    await client.end();
    return res.status(200).json({ ok:true, aluno: rows[0] || null, used:'POOLED_URL' });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  }
}
