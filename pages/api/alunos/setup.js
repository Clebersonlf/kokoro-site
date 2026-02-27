import { sql } from '../_lib/db.js';
export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Metodo nao permitido'});
  try{
    await sql`CREATE TABLE IF NOT EXISTS alunos(id SERIAL PRIMARY KEY,nome TEXT NOT NULL,email TEXT DEFAULT '',faixa TEXT DEFAULT 'branca',grau TEXT DEFAULT '0º Grau',ultima TEXT DEFAULT '-',financeiro TEXT DEFAULT 'ok',status TEXT DEFAULT 'ativo',historico JSONB DEFAULT '[]',numero_certificado TEXT DEFAULT '',observacoes TEXT DEFAULT '',created_at TIMESTAMP DEFAULT NOW(),updated_at TIMESTAMP DEFAULT NOW())`;
    const cnt=await sql`SELECT COUNT(*) as total FROM alunos`;
    if(parseInt(cnt[0].total)>0) return res.status(200).json({ok:true,msg:'Tabela ja possui dados',total:cnt[0].total});
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes) VALUES('RONALDO Rodrigues Pacheco','roxa','0º Grau','0022','')`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes) VALUES('CESAR Ferreira Bellotti Lima','azul','0º Grau','0024','')`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes) VALUES('Robert Acevedo','branca','0º Grau','0062','')`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes) VALUES('Uriel Pinto Folly','azul','0º Grau','0034','')`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes) VALUES('Rickson dos Anjos Oliveira','branca','0º Grau','0044','')`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes) VALUES('Wanderson Nogueira de Paula','branca','0º Grau','0051','')`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes) VALUES('Selênio Campos Filho','branca','0º Grau','0052','03/12/2011')`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes) VALUES('Vinicius Pereira de Araujo','branca','0º Grau','0050','')`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes) VALUES('Sophia Braga Capristrano','branca','0º Grau','0059','')`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes) VALUES('LAURA L','branca','0º Grau','0061','')`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes) VALUES('Juliano Magno Guedes','branca','0º Grau','0065','')`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes) VALUES('Fernando Castagna Ferreira','branca','0º Grau','0066','')`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes) VALUES('Evandro Ribeiro da Silva','branca','0º Grau','0067','')`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes) VALUES('Ruan Felipe de Oliveira Barros','branca','0º Grau','0068','')`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes) VALUES('CARLOS VICTOR ROMAN. PUJATT','branca','0º Grau','0069','')`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes) VALUES('CARLOS EDUARDO P. M. ARAUJO','branca','0º Grau','0070','')`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes) VALUES('RENAN CARLOS SILVA COSTA','branca','0º Grau','0071','')`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes) VALUES('Bernardo Henrique Amorim Silva','branca','0º Grau','0072','')`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes) VALUES('Samilly Angel Almeida Silva','branca','0º Grau','0073','')`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes) VALUES('Daniel Henrique de Araujo','branca','0º Grau','0074','')`;
    return res.status(200).json({ok:true,msg:'Tabela criada e 20 alunos migrados!'});
  }catch(e){return res.status(500).json({error:e.message});}
}
