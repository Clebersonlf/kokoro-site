import { createClient } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  try {
    // 🔒 força usar somente a URL POOLING
    const POOL = process.env.POSTGRES_URL;
    if (!POOL) {
      return res.status(500).json({ ok:false, error:'POSTGRES_URL não definido' });
    }

    // cria client com a pooled connection
    const client = createClient({ connectionString: POOL });
    await client.connect();

    const body = typeof req.body === 'string'
      ? JSON.parse(req.body || '{}')
      : (req.body || {});

    const { token, nome, email, telefone, whatsapp, endereco, nascimento, observacoes } = body;

    if (!token)  return res.status(400).json({ ok:false, error:'Falta token' });
    if (!nome)   return res.status(400).json({ ok:false, error:'Falta nome' });
    if (!email)  return res.status(400).json({ ok:false, error:'Falta email' });

    // tabela idempotente
    await client.sql`
      CREATE TABLE IF NOT EXISTS alunos (
        id               TEXT PRIMARY KEY,
        nome             TEXT NOT NULL,
        email            TEXT UNIQUE,
        telefone         TEXT,
        whatsapp         TEXT,
        endereco         TEXT,
        nascimento       DATE,
        observacoes      TEXT,
        numero_vitalicio TEXT,
        status           TEXT,
        criado_em        TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
// id simples (sem extensão)
    const newId = 'a_' + Math.random().toString(36).slice(2,10) + Date.now().toString(36);

    const { rows } = await client.sql`
      INSERT INTO alunos (id, nome, email, telefone, whatsapp, endereco, nascimento, observacoes)
      VALUES (
        ${newId},
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
    return res.status(200).json({ ok:true, aluno: rows[0] || null, used:'POSTGRES_URL' });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  }
}
