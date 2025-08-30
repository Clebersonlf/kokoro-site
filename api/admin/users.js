export default async function handler(req, res) {
  const started = Date.now();
  try {
    const url =
      process.env.DATABASE_URL ||
      process.env.NEON_DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL_NON_POOLING || "";

    if (!url) {
      return res.status(500).json({ ok:false, step:"env", message:"DATABASE_URL ausente" });
    }

    const mod = await import("@neondatabase/serverless");
    const neon = mod.neon || mod.default?.neon || mod.default;
    const neonConfig = mod.neonConfig || mod.default?.neonConfig || {};
    const fetchWithTimeout = async (u, opts={})=>{
      const ac = new AbortController();
      const id = setTimeout(()=>ac.abort("timeout"), 10_000);
      try { return await fetch(u, { ...opts, signal: ac.signal }); }
      finally { clearTimeout(id); }
    };
    if (neonConfig){
      neonConfig.fetchFunction = fetchWithTimeout;
      neonConfig.poolQueryViaFetch = true;
    }

    const sql = neon(url);

    // Confere se a tabela existe
    const tbl = await sql`select to_regclass('public.usuarios') as t`;
    if (!tbl?.[0]?.t) {
      return res.status(404).json({ ok:false, step:"table", message:"Tabela public.usuarios não existe" });
    }

    // Descobre colunas
    const cols = await sql`
      select column_name
      from information_schema.columns
      where table_schema = 'public' and table_name = 'usuarios'
      order by ordinal_position
    `;
    const names = (cols||[]).map(r => r.column_name);
    if (!names.length) {
      return res.status(500).json({ ok:false, step:"columns", message:"Sem colunas na tabela usuarios" });
    }

    // Seleciona colunas preferidas se existirem; senão, primeiras 5
    const prefer = ['id','nome','email','role','created_at'];
    const pick = prefer.filter(p => names.includes(p));
    const selectList = (pick.length ? pick : names.slice(0,5))
      .map(n => `"${n}"`).join(', ');

    // Consulta
    const rows = await sql(`select ${selectList} from public.usuarios order by 1 limit 20`);

    res.setHeader("Cache-Control","no-store");
    return res.status(200).json({
      ok:true, step:'users-ok',
      columns_used: pick.length ? pick : names.slice(0,5),
      count: rows.length,
      rows,
      elapsed_ms: Date.now()-started
    });
  } catch (e) {
    return res.status(500).json({
      ok:false, step:'users-fail',
      name: e?.name ?? null,
      message: e?.message ?? String(e),
      stack: e?.stack ?? null,
      elapsed_ms: Date.now()-started
    });
  }
}
