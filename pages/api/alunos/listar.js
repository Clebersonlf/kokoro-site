import { sql } from '../_lib/db.js';
import { exigirAdmin } from '../_lib/kokoro-auth.js';

export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Metodo nao permitido'});
  res.setHeader('Cache-Control', 'no-store');
  const sessao = exigirAdmin(req, res);
  if (!sessao) return;
  try{
    const r = await sql`SELECT id,nome,email,faixa,grau,ultima,financeiro,status,historico,numero_certificado as "numeroCertificado",codigo_interno as "codigoInterno",observacoes,foto FROM alunos ORDER BY nome ASC`;
    return res.status(200).json(r);
  }catch(e){return res.status(500).json({error:e.message});}
}
