import { createClient } from '@vercel/postgres';

// CORS básico p/ testes locais/anônimos
function withCors(req, res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  if(req.method === 'OPTIONS'){ res.status(200).end(); return true; }
  return false;
}

export default async function handler(req, res){
  if (withCors(req,res)) return;

  if (req.method !== 'POST'){
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  try{
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const { token } = body;
    if(!token) return res.status(400).json({ ok:false, error:'Informe o token' });

    const POOL = process.env.POSTGRES_URL;
    if(!POOL) return res.status(500).json({ ok:false, error:'POSTGRES_URL não definido' });

    const client = createClient({ connectionString: POOL });
    await client.connect();

    // Garante a tabela (mesma estrutura que usamos ao criar convites)
    await client.sql`
      CREATE TABLE IF NOT EXISTS convites (
        id        TEXT PRIMARY KEY,
        token     TEXT UNIQUE NOT NULL,
        email     TEXT NOT NULL,
        nome      TEXT,
        telefone  TEXT,
        status    TEXT NOT NULL DEFAULT 'pendente',
        criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
        usado_em  TIMESTAMPTZ
      );
    `;

    const { rowCount } = await client.sql`
      UPDATE convites
      SET status = 'cancelado'
      WHERE token = ${token};
    `;

    await client.end();
    if(rowCount === 0){
      return res.status(404).json({ ok:false, error:'Convite não encontrado' });
    }
    return res.status(200).json({ ok:true, token, status:'cancelado' });
  }catch(e){
    return res.status(500).json({ ok:false, error:String(e) });
  }
}
