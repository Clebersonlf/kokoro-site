export default async function handler(req, res) {
  try {
    const { searchParams } = new URL(req.url, 'http://x');
    const id = (searchParams.get('id') || '').trim();
    if (!id) return res.status(400).json({ ok:false, message:'Informe ?id=' });

    const mod = await import('@neondatabase/serverless');
    const neon = mod.neon || mod.default?.neon || mod.default;
    const sql  = neon(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || '');

    const rows = await sql`select id,nome,email,telefone,cad_numero,created_at from alunos where id=${id} limit 1`;
    if (!rows.length) return res.status(404).json({ ok:false, message:'Aluno não encontrado' });

    return res.status(200).json({ ok:true, aluno: rows[0] });
  } catch (e) {
    return res.status(500).json({ ok:false, message:e?.message||'Erro' });
  }
}
