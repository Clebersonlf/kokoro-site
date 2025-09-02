import { createClient } from '@vercel/postgres';

function rid(prefix='k_'){
  return prefix + Math.random().toString(36).slice(2,10) + Date.now().toString(36);
}
function rtoken(n=22){
  const abc='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s=''; for(let i=0;i<n;i++) s+=abc[Math.floor(Math.random()*abc.length)];
  return s;
}

export default async function handler(req, res){
  if(req.method!=='POST'){
    res.setHeader('Allow','POST');
    return res.status(405).json({ok:false,error:'Method not allowed'});
  }

  // força pooled
  const POOL = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if(!POOL) return res.status(500).json({ok:false,error:'DB URL não configurada'});

  const client = createClient({ connectionString: POOL });
  await client.connect();

  try{
    const body = typeof req.body==='string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const { nome, email, telefone, wa, obs } = body;

    if(!email) return res.status(400).json({ok:false,error:'Informe o e-mail'});
    const id = rid('c_');
    const token = rtoken();

    // tabela
    await client.sql`
      CREATE TABLE IF NOT EXISTS convites (
        id         TEXT PRIMARY KEY,
        token      TEXT UNIQUE NOT NULL,
        email      TEXT NOT NULL,
        nome       TEXT,
        telefone   TEXT,
        wa         TEXT,
        obs        TEXT,
        status     TEXT NOT NULL DEFAULT 'pendente', -- pendente|concluido|cancelado
        criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
        usado_em   TIMESTAMPTZ
      );
    `;

    // grava
    await client.sql`
      INSERT INTO convites (id, token, email, nome, telefone, wa, obs)
      VALUES (${id}, ${token}, ${email}, ${nome||null}, ${telefone||null}, ${wa||null}, ${obs||null});
    `;

    await client.end();
    return res.status(200).json({ok:true, token});
  }catch(e){
    try{ await client.end(); }catch(_){}
    return res.status(500).json({ok:false,error:String(e)});
  }
}
