export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({ok:false,message:'Use POST'}); }
    const body = await new Promise((resolve,reject)=>{
      let d=''; req.on('data',c=>d+=c);
      req.on('end',()=>{ try{resolve(JSON.parse(d||'{}'))}catch(e){reject(e)} });
      req.on('error',reject);
    });
    const id = (body.id||'').trim();
    if (!id) return res.status(400).json({ ok:false, message:'Informe id' });

    const mod = await import('@neondatabase/serverless');
    const neon = mod.neon || mod.default?.neon || mod.default;
    const sql  = neon(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || '');

    const rows = await sql`delete from alunos where id=${id} returning id`;
    if (!rows.length) return res.status(404).json({ ok:false, message:'Aluno não encontrado' });
    return res.status(200).json({ ok:true, deleted: rows[0].id });
  } catch (e) {
    return res.status(500).json({ ok:false, message:e?.message||'Erro' });
  }
}
