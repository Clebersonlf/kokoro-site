import { createClient } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  try {
    const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!url) return res.status(500).json({ ok:false, error:'DB URL ausente' });

    const client = createClient({ connectionString: url });
    await client.connect();

    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const {
      nome,
      email,
      telefone,
      whatsapp,   // <- padronizado
      obs         // <- observações opcionais
    } = body;

    if (!email) return res.status(400).json({ ok:false, error:'Informe o e-mail' });

    // garante tabela e colunas (idempotente)
    await client.sql`
      CREATE TABLE IF NOT EXISTS convites (
        id        TEXT PRIMARY KEY,
        token     TEXT UNIQUE NOT NULL,
        email     TEXT NOT NULL,
        nome      TEXT,
        telefone  TEXT,
        whatsapp  TEXT,
        obs       TEXT,
        status    TEXT NOT NULL DEFAULT 'pendente',
        criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
        usado_em  TIMESTAMPTZ
      );
    `;

    // id e token simples
    const id    = 'c_' + Math.random().toString(36).slice(2,10) + Date.now().toString(36);
    const token = Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12);

    const { rows } = await client.sql`
      INSERT INTO convites (id, token, email, nome, telefone, whatsapp, obs)
      VALUES (${id}, ${token}, ${email}, ${nome||null}, ${telefone||null}, ${whatsapp||null}, ${obs||null})
      RETURNING id, token, email, nome, telefone, whatsapp, obs, status, criado_em;
    `;

    await client.end();

    const link = `https://www.planckkokoro.com/cadastro.html?token=${encodeURIComponent(token)}`;
    return res.status(200).json({ ok:true, convite: rows[0], link });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  }
}
