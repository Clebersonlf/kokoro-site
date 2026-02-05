const { sql } = require('../_lib/db.js');
module.exports = async function handler(req, res) {
  res.setHeader('Content-Type','application/json; charset=utf-8');
  try {
    const r = await sql`select now() as now, current_database() as db, version() as ver`;
    return res.status(200).json({
      ok: true,
      now: r.rows?.[0]?.now ?? null,
      db:  r.rows?.[0]?.db ?? null,
      ver: (r.rows?.[0]?.ver || '').split('\n')[0]
    });
  } catch (e) {
    return res.status(200).json({ ok:false, error:String(e) });
  }
}
