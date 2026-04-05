import { sql } from '../_lib/db.js';

export default async function handler(req,res){
  const { nome, email, faixa, grau, financeiro, status } = req.body;
  if(req.method!=='POST') return res.status(405).json({error:'Metodo nao permitido'});
  try{
    const r = await sql`INSERT INTO alunos (nome, email, faixa, grau, financeiro, status, historico, numero_certificado, observacoes, ultima) VALUES (${nome}, ${email}, ${faixa}, ${grau}, ${financeiro}, ${status}, '[]', '', '', '-') RETURNING *`;
    return res.status(201).json(r);
  }catch(e){return res.status(500).json({error:e.message});}
}
