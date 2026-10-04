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
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS codigo_interno TEXT DEFAULT ''`;

    // Dados complementares da graduacao esportiva
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS ano_graduacao TEXT`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nome_equipe TEXT`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nome_professor TEXT`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS graduacao_professor TEXT`;

    // Complementos do cadastro completo
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nivel_faixa_branca TEXT`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS dados_verdadeiros BOOLEAN`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS autorizo_imagem BOOLEAN`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS entidades JSONB DEFAULT '[]'`;

    // Responsavel legal / cadastro de menor
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS responsavel_nome TEXT`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS responsavel_rg TEXT`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS responsavel_cpf TEXT`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS responsavel_parentesco TEXT`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS responsavel_parentesco_outro TEXT`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS menor_nome_completo TEXT`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS menor_substancias_ciente BOOLEAN`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS menor_medicamentos_ciente BOOLEAN`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS menor_medicamento_nome TEXT`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS menor_medicamento_motivo TEXT`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS menor_medicamento_continuo TEXT`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS responsavel_cidade TEXT`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS responsavel_data DATE`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS responsavel_telefone TEXT`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS responsavel_email TEXT`;
    await sql`ALTER TABLE alunos ADD COLUMN IF NOT EXISTS responsavel_assinatura BOOLEAN`;

    await sql`ALTER TABLE certificados ADD COLUMN IF NOT EXISTS aluno_id INTEGER`;
    await sql`ALTER TABLE certificados ADD COLUMN IF NOT EXISTS codigo_base TEXT DEFAULT ''`;
    const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='alunos' ORDER BY ordinal_position`;
    return res.status(200).json({ok:true, msg:'Colunas adicionadas com sucesso!', colunas: cols.map(c=>c.column_name)});
  }catch(e){return res.status(500).json({error:e.message});}
}
