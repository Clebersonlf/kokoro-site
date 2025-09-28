import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const r = await sql`select now() as now`;
    return res.status(200).json({ ok: true, now: r.rows?.[0]?.now ?? null });
  } catch (e) {
    // SEM 500: sempre 200 com erro detalhado
    return res.status(200).json({ ok: false, error: String(e) });
  }
}
