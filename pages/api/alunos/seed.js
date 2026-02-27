import { sql } from '../_lib/db.js';
export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Metodo nao permitido'});
  try{
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes,status,financeiro,ultima) VALUES('RONALDO Rodrigues Pacheco','roxa','0º Grau','0022','','ativo','ok','-') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes,status,financeiro,ultima) VALUES('CESAR Ferreira Bellotti Lima','azul','0º Grau','0024','','ativo','ok','-') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes,status,financeiro,ultima) VALUES('Robert Acevedo','branca','0º Grau','0062','','ativo','ok','-') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes,status,financeiro,ultima) VALUES('Uriel Pinto Folly','azul','0º Grau','0034','','ativo','ok','-') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes,status,financeiro,ultima) VALUES('Rickson dos Anjos Oliveira','branca','0º Grau','0044','','ativo','ok','-') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes,status,financeiro,ultima) VALUES('Wanderson Nogueira de Paula','branca','0º Grau','0051','','ativo','ok','-') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes,status,financeiro,ultima) VALUES('Selênio Campos Filho','branca','0º Grau','0052','03/12/2011','ativo','ok','-') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes,status,financeiro,ultima) VALUES('Vinicius Pereira de Araujo','branca','0º Grau','0050','','ativo','ok','-') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes,status,financeiro,ultima) VALUES('Sophia Braga Capristrano','branca','0º Grau','0059','','ativo','ok','-') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes,status,financeiro,ultima) VALUES('LAURA L','branca','0º Grau','0061','','ativo','ok','-') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes,status,financeiro,ultima) VALUES('Juliano Magno Guedes','branca','0º Grau','0065','','ativo','ok','-') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes,status,financeiro,ultima) VALUES('Fernando Castagna Ferreira','branca','0º Grau','0066','','ativo','ok','-') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes,status,financeiro,ultima) VALUES('Evandro Ribeiro da Silva','branca','0º Grau','0067','','ativo','ok','-') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes,status,financeiro,ultima) VALUES('Ruan Felipe de Oliveira Barros','branca','0º Grau','0068','','ativo','ok','-') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes,status,financeiro,ultima) VALUES('CARLOS VICTOR ROMAN. PUJATT','branca','0º Grau','0069','','ativo','ok','-') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes,status,financeiro,ultima) VALUES('CARLOS EDUARDO P. M. ARAUJO','branca','0º Grau','0070','','ativo','ok','-') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes,status,financeiro,ultima) VALUES('RENAN CARLOS SILVA COSTA','branca','0º Grau','0071','','ativo','ok','-') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes,status,financeiro,ultima) VALUES('Bernardo Henrique Amorim Silva','branca','0º Grau','0072','','ativo','ok','-') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes,status,financeiro,ultima) VALUES('Samilly Angel Almeida Silva','branca','0º Grau','0073','','ativo','ok','-') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes,status,financeiro,ultima) VALUES('Daniel Henrique de Araujo','branca','0º Grau','0074','','ativo','ok','-') ON CONFLICT DO NOTHING`;
    const total = await sql`SELECT COUNT(*) as total FROM alunos`;
    return res.status(200).json({ok:true, msg:'20 alunos reais inseridos!', total_banco: total[0].total});
  }catch(e){return res.status(500).json({error:e.message});}
}
