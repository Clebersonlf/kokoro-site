import { getClient } from './_dbflex';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});

    const {
      token, nome, email, telefone, whatsapp, endereco, nascimento, observacoes
    } = body;

    // Validações mínimas
    if (!token)  return res.status(400).json({ ok:false, error:'Falta token' });
    if (!nome)   return res.status(400).json({ ok:false, error:'Falta nome' });
    if (!email)  return res.status(400).json({ ok:false, error:'Falta email' });

    const client = await getClient();

    // Cria tabela se não existir (idempotente)
    await client.query(`
      CREATE TABLE IF NOT EXISTS alunos (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome            TEXT NOT NULL,
        email           TEXT UNIQUE,
        telefone        TEXT,
        whatsapp        TEXT,
        endereco        TEXT,
        nascimento      DATE,
        observacoes     TEXT,
        numero_vitalicio TEXT,
        status          TEXT,
        criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // UPSERT por email (não cria duplicado)
    const { rows } = await client.query(
      `INSERT INTO alunos (nome,email,telefone,whatsapp,endereco,nascimento,observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (email) DO UPDATE
       SET nome=EXCLUDED.nome,
           telefone=EXCLUDED.telefone,
           whatsapp=EXCLUDED.whatsapp,
           endereco=EXCLUDED.endereco,
           nascimento=EXCLUDED.nascimento,
           observacoes=EXCLUDED.observacoes
       RETURNING id,nome,email,telefone,whatsapp,endereco,nascimento,observacoes,criado_em;`,
      [nome, email, telefone||null, whatsapp||null, endereco||null, nascimento||null, observacoes||null]
    );

    const aluno = rows[0] || null;

    await client.end();

    return res.status(200).json({ ok:true, aluno, used: process.env.POSTGRES_URL ? 'POSTGRES_URL' : 'DATABASE_URL' });
  } catch (e) {
    return res.status(500).json({ ok:false, error: String(e) });
  }
}
