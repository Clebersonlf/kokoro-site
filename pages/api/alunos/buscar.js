import { sql } from '../_lib/db.js';
export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Metodo nao permitido'});
  const {id}=req.query;
  if(!id) return res.status(400).json({error:'ID obrigatorio'});
  try{
    const r=await sql`SELECT id,nome,email,faixa,grau,ultima,financeiro,status,historico,numero_certificado as "numeroCertificado",observacoes FROM alunos WHERE id=${id}`;
    if(!r.length) return res.status(404).json({error:'Aluno nao encontrado'});
    return res.status(200).json(r[0]);
  }catch(e){return res.status(500).json({error:e.message});}
}
