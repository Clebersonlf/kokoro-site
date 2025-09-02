import { createClient } from '@vercel/postgres';

function uid(prefix='c_'){
  return prefix + Math.random().toString(36).slice(2,10) + Date.now().toString(36);
}
function makeToken(){
  return 'TOK-' + Math.random().toString(36).slice(2,10).toUpperCase();
}

export default async function handler(req, res){
  if(req.method !== 'POST'){
    res.setHeader('Allow','POST');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }
  try {
    const POOL = process.env.POSTGRES_URL;
    if(!POOL) return res.status(500).json({ ok:false, error:'POSTGRES_URL não definido' });

    const client = createClient({ connectionString: POOL });
    await client.connect();

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { nome='', email='', telefone='' } = body;

    if(!email) { await client.end(); return res.status(400).json({ ok:false, error:'Falta e-mail' }); }

    // garante tabela convites (idempotente)
    await client.sql`
      CREATE TABLE IF NOT EXISTS convites (
        id         TEXT PRIMARY KEY,
        token      TEXT UNIQUE NOT NULL,
        email      TEXT NOT NULL,
        nome       TEXT,
        telefone   TEXT,
        status     TEXT NOT NULL DEFAULT 'pendente', -- pendente|concluido|cancelado
        criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
        usado_em   TIMESTAMPTZ
      );
    `;
    await client.sql`CREATE INDEX IF NOT EXISTS idx_convites_email  ON convites(email);`;
    await client.sql`CREATE INDEX IF NOT EXISTS idx_convites_status ON convites(status);`;

    const id = uid();
    const token = makeToken();

    await client.sql`
      INSERT INTO convites (id, token, email, nome, telefone)
      VALUES (${id}, ${token}, ${email}, ${nome || null}, ${telefone || null})
      ON CONFLICT (token) DO NOTHING;
    `;

    const inviteUrl = `https://www.planckkokoro.com/cadastro/finalizar.html?token=${encodeURIComponent(token)}`;

    await client.end();
    return res.status(200).json({ ok:true, id, token, link: inviteUrl });
  } catch (e) {
    return res.status(500).json({ ok:false, error: String(e) });
  }
}
