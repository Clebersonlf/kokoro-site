import { getClientAuto } from '../_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const client = getClientAuto();
  try {
    await client.connect();
    const r = await client.sql`select now() as now`;
    return res.status(200).json({ ok: true, now: r.rows?.[0]?.now ?? null, mode: process.env.POSTGRES_URL ? 'pooled' : 'direct' });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e) });
  } finally {
    try { await client.end(); } catch {}
  }
}
