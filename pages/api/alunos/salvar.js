import { sql } from '../_lib/db.js';
export default async function handler(req,res){
  if(!['POST','PUT'].includes(req.method)) return res.status(405).json({error:'Metodo nao permitido'});
  const {id,nome,email='',faixa='branca',grau='0º Grau',ultima='-',financeiro='ok',status='ativo',historico=[],numeroCertificado='',observacoes=''}=req.body||{};
  if(!nome) return res.status(400).json({error:'Nome obrigatorio'});
  try{
    if(req.method==='PUT'){
      if(!id) return res.status(400).json({error:'ID obrigatorio para atualizacao'});
      const r=await sql`UPDATE alunos SET nome=${nome},email=${email},faixa=${faixa},grau=${grau},ultima=${ultima},financeiro=${financeiro},status=${status},historico=${JSON.stringify(historico)}::jsonb,numero_certificado=${numeroCertificado},observacoes=${observacoes},updated_at=NOW() WHERE id=${id} RETURNING *`;
      if(!r.length) return res.status(404).json({error:'Aluno nao encontrado'});
      return res.status(200).json(r[0]);
    }else{
      const r=await sql`INSERT INTO alunos(nome,email,faixa,grau,ultima,financeiro,status,historico,numero_certificado,observacoes) VALUES(${nome},${email},${faixa},${grau},${ultima},${financeiro},${status},${JSON.stringify(historico)}::jsonb,${numeroCertificado},${observacoes}) RETURNING *`;
      return res.status(201).json(r[0]);
    }
  }catch(e){return res.status(500).json({error:e.message});}
}
