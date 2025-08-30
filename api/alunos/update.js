export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({ok:false,message:'Use POST'}); }

    const body = await new Promise((resolve,reject)=>{
      let d=''; req.on('data',c=>d+=c);
      req.on('end',()=>{ try{resolve(JSON.parse(d||'{}'))}catch(e){reject(e)} });
      req.on('error',reject);
    });

    const id = (body.id||'').trim();
    const nome = (body.nome||'').trim();
    const email = (body.email||'').trim().toLowerCase();
    const telefone = (body.telefone||'').trim();
    let cad_numero = (body.cad_numero||'').trim();
    if (!id)   return res.status(400).json({ ok:false, message:'Informe id' });
    if (!nome) return res.status(400).json({ ok:false, message:'Informe nome' });

    if (cad_numero) cad_numero = cad_numero.padStart(4,'0').slice(-4);

    const mod = await import('@neondatabase/serverless');
    const neon = mod.neon || mod.default?.neon || mod.default;
    const sql  = neon(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || '');

    if (email) {
      const dup = await sql`select 1 from alunos where lower(email)=${email} and id<>${id} limit 1`;
      if (dup.length) return res.status(409).json({ ok:false, message:'E-mail já em uso por outro aluno' });
    }

    const rows = await sql`
      update alunos
         set nome=${nome},
             email=nullif(${email},''),
             telefone=nullif(${telefone},''),
             cad_numero=nullif(${cad_numero},'')
       where id=${id}
      returning id,nome,email,telefone,cad_numero,created_at
    `;
    if (!rows.length) return res.status(404).json({ ok:false, message:'Aluno não encontrado' });

    return res.status(200).json({ ok:true, aluno: rows[0] });
  } catch (e) {
    return res.status(500).json({ ok:false, message:e?.message||'Erro' });
  }
}
