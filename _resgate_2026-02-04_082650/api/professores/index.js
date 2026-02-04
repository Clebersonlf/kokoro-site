import { getClient } from '../../lib/db.js';

function isAdmin(req){const s=req.headers['x-admin-secret'];return s && s===process.env.ADMIN_SECRET;}

export default async function handler(req,res){
  if (!isAdmin(req)) return res.status(401).json({ok:false,error:'unauthorized'});

  const client = getClient(); await client.connect();
  try {
    if (req.method === 'POST') {
      const { id, nome, tipo, cpf, telefone, email, pix_chave, banco_nome, agencia, conta, favorecido_nome, doc_favorecido, ativo=true } = req.body || {};
      if (!nome || !tipo) return res.status(400).json({ok:false,error:'nome e tipo são obrigatórios'});
      if (!['TITULAR','AUXILIAR','INSTRUTOR'].includes(tipo)) return res.status(400).json({ok:false,error:'tipo inválido'});

      if (id) {
        const { rows } = await client.sql`
          UPDATE professores
             SET nome=${nome}, tipo=${tipo}, cpf=${cpf||null}, telefone=${telefone||null}, email=${email||null},
                 pix_chave=${pix_chave||null}, banco_nome=${banco_nome||null}, agencia=${agencia||null},
                 conta=${conta||null}, favorecido_nome=${favorecido_nome||null}, doc_favorecido=${doc_favorecido||null},
                 ativo=${Boolean(ativo)}
           WHERE id=${id}
       RETURNING *;`;
        return res.json({ok:true,data:rows[0]||null});
      } else {
        const { rows } = await client.sql`
          INSERT INTO professores (nome,tipo,cpf,telefone,email,pix_chave,banco_nome,agencia,conta,favorecido_nome,doc_favorecido,ativo)
          VALUES (${nome},${tipo},${cpf||null},${telefone||null},${email||null},
                  ${pix_chave||null},${banco_nome||null},${agencia||null},${conta||null},${favorecido_nome||null},${doc_favorecido||null},${Boolean(ativo)})
          RETURNING *;`;
        return res.json({ok:true,data:rows[0]});
      }
    }

    if (req.method === 'GET') {
      const url = new URL(req.url, `https://${req.headers.host}`);
      const q = url.searchParams.get('q');
      if (q) {
        const { rows } = await client.sql`
          SELECT * FROM professores
          WHERE unaccent(lower(nome)) LIKE unaccent(lower(${`%${q}%`}))
          ORDER BY nome ASC LIMIT 50;
        `;
        return res.json({ok:true,data:rows});
      } else {
        const { rows } = await client.sql`SELECT * FROM professores ORDER BY nome ASC LIMIT 200;`;
        return res.json({ok:true,data:rows});
      }
    }

    res.setHeader('Allow','GET,POST');
    return res.status(405).json({ok:false,error:'Method not allowed'});
  } catch(e){
    return res.status(500).json({ok:false,error:String(e)});
  } finally {
    await client.end();
  }
}
