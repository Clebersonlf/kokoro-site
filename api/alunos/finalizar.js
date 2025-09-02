import { sql } from '@vercel/postgres';

export default async function handler(req,res){
  if(req.method !== "POST"){
    return res.status(405).json({ok:false,error:"Método não permitido"});
  }
  try{
    const { token, nome, email, telefone, whatsapp, endereco, nascimento, observacoes } = req.body || {};
    if(!token) return res.status(400).json({ok:false,error:"Token obrigatório"});

    // Verifica se existe convite válido
    const conv = await sql`SELECT id, aluno_id FROM convites WHERE token=${token}`;
    if(conv.rows.length === 0){
      return res.status(400).json({ok:false,error:"Convite inválido ou expirado"});
    }
    const alunoId = conv.rows[0].aluno_id;

    // Atualiza cadastro do aluno
    await sql`
      UPDATE alunos SET
        nome=${nome}, email=${email}, telefone=${telefone},
        whatsapp=${whatsapp}, endereco=${endereco},
        data_nascimento=${nascimento}, observacoes=${observacoes},
        status='ativo'
      WHERE id=${alunoId};
    `;

    // Apaga convite (só pode usar 1 vez)
    await sql`DELETE FROM convites WHERE token=${token}`;

    return res.json({ok:true,alunoId});
  }catch(err){
    console.error("Erro /api/alunos/finalizar:",err);
    return res.status(500).json({ok:false,error:String(err)});
  }
}
