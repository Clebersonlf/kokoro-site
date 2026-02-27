import { sql } from '../_lib/db.js';
export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Metodo nao permitido'});
  try{
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS grau TEXT DEFAULT '0º Grau'`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS ultima TEXT DEFAULT '-'`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS financeiro TEXT DEFAULT 'ok'`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS historico JSONB DEFAULT '[]'`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS numero_certificado TEXT DEFAULT ''`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS observacoes TEXT DEFAULT ''`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`;
    const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='alunos' ORDER BY ordinal_position`;
    return res.status(200).json({ok:true, msg:'Colunas adicionadas com sucesso!', colunas: cols.map(c=>c.column_name)});
  }catch(e){return res.status(500).json({error:e.message});}
}
