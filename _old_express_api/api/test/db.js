import { getClient } from '../../_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const client = getClient();
    await client.connect();
    const r = await client.sql`select now() as now, current_database() as db, version() as ver`;
    await client.end();
    return res.status(200).json({
      ok: true,
      now: r.rows?.[0]?.now ?? null,
      db: r.rows?.[0]?.db ?? null,
      ver: (r.rows?.[0]?.ver || '').split('\n')[0],
      env: {
        POSTGRES_URL: !!process.env.POSTGRES_URL,
        DATABASE_URL: !!process.env.DATABASE_URL,
        POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING
      }
    });
  } catch (e) {
    // Nunca 500: mostra o erro claramente
    return res.status(200).json({
      ok: false,
      error: String(e),
      env: {
        POSTGRES_URL: !!process.env.POSTGRES_URL,
        DATABASE_URL: !!process.env.DATABASE_URL,
        POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING
      }
    });
  }
}
