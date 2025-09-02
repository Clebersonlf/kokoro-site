import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const { token, nome, email, telefone, whatsapp, endereco, nascimento, observacoes } = body;

    if (!token)  return res.status(400).json({ ok:false, error:'Falta token' });
    if (!nome)   return res.status(400).json({ ok:false, error:'Falta nome' });
    if (!email)  return res.status(400).json({ ok:false, error:'Falta email' });

    // Tabela idempotente (sem extensões)
    await sql`
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

    const newId = 'a_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

    // UPSERT por email
    const { rows } = await sql`
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

    const used = process.env.POSTGRES_URL ? 'POSTGRES_URL' : (process.env.DATABASE_URL ? 'DATABASE_URL' : 'none');
    return res.status(200).json({ ok:true, aluno: rows[0] || null, used });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  

mkdir -p api/dbtest

cat > api/dbtest/finalizar.js <<'JS'
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const { token, nome, email, telefone, whatsapp, endereco, nascimento, observacoes } = body;

    if (!token)  return res.status(400).json({ ok:false, error:'Falta token' });
    if (!nome)   return res.status(400).json({ ok:false, error:'Falta nome' });
    if (!email)  return res.status(400).json({ ok:false, error:'Falta email' });

    // Tabela idempotente (sem extensões)
    await sql`
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

    const newId = 'a_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

    // UPSERT por email
    const { rows } = await sql`
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

    const used = process.env.POSTGRES_URL ? 'POSTGRES_URL' : (process.env.DATABASE_URL ? 'DATABASE_URL' : 'none');
    return res.status(200).json({ ok:true, aluno: rows[0] || null, used });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  }
}
