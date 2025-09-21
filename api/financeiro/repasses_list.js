import { getClient } from '../../lib/db.js';

export default async function handler(req,res){
  try{
    if(req.method!=='GET'){ res.setHeader('Allow','GET'); return res.status(405).json({ok:false,error:'Method not allowed'}); }
    const secret = req.headers['x-admin-secret'];
    if(!secret || secret !== process.env.ADMIN_SECRET){ return res.status(401).json({ok:false,error:'unauthorized'}); }

    const u = new URL(req.url, `https://${req.headers.host}`);
    const q = Object.fromEntries(u.searchParams.entries());
    const professor_id = q.professor_id || null;
    const from = q.from || null;
    const to   = q.to   || null;
    const search = (q.search||'').trim();
    const limit = Math.max(1, Math.min(200, Number(q.limit||50)));
    const offset= Math.max(0, Number(q.offset||0));

    const client = getClient(); await client.connect();
    try{
      await client.sql`CREATE TABLE IF NOT EXISTS repasses (
        id BIGSERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        professor_id UUID NOT NULL,
        base_valor NUMERIC(12,2) NOT NULL DEFAULT 0,
        percent NUMERIC(7,4) NOT NULL DEFAULT 0,
        repasse_valor NUMERIC(12,2) NOT NULL DEFAULT 0,
        metodo TEXT NOT NULL DEFAULT 'PIX',
        pago_em TIMESTAMPTZ NOT NULL,
        observacao TEXT,
        referencia TEXT NOT NULL
      );`;
      await client.sql`CREATE UNIQUE INDEX IF NOT EXISTS repasses_ref_uniq ON repasses(referencia);`;

      // filtros dinâmicos
      const where = [];
      const params = {};
      if(professor_id){ where.push(`professor_id = ${'professor_id'}`); params.professor_id = professor_id; }
      if(from){ where.push(`pago_em >= ${'from'}`); params.from = new Date(from).toISOString(); }
      if(to){ where.push(`pago_em < ${'to'}`); params.to = new Date(to).toISOString(); }
      if(search){
        where.push(`(LOWER(observacao) LIKE ${'s1'} OR LOWER(referencia) LIKE ${'s2'})`);
        params.s1 = `%${search.toLowerCase()}%`;
        params.s2 = `%${search.toLowerCase()}%`;
      }
      const whereSql = where.length ? ('WHERE '+where.join(' AND ')) : '';

      const { rows } = await client.sql({
        text: `
          SELECT id, created_at, professor_id, base_valor, percent, repasse_valor,
                 metodo, pago_em, observacao, referencia
          FROM repasses
          ${whereSql}
          ORDER BY pago_em DESC, id DESC
          LIMIT ${limit} OFFSET ${offset};`,
        values: Object.values(params)
      });

      const { rows: tot } = await client.sql({
        text: `
          SELECT COUNT(*)::int AS count,
                 COALESCE(SUM(base_valor),0)::numeric(12,2) AS base_total,
                 COALESCE(SUM(repasse_valor),0)::numeric(12,2) AS repasse_total
          FROM repasses
          ${whereSql};`,
        values: Object.values(params)
      });

      return res.json({ ok:true, items: rows, total: tot[0] });
    }catch(e){
      return res.status(500).json({ok:false,error:String(e)});
    }finally{
      await client.end();
    }
  }catch(err){
    return res.status(500).json({ok:false,error:String(err)});
  }
}
