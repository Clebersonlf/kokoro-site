import { sql } from '@vercel/postgres';
import { ensureSchema } from '../_lib/db.js';

export default async function handler(req, res) {
  try {
    await ensureSchema();
    const { rows } = await sql`select now() as agora`;
    return res.status(200).json({ ok: true, agora: rows[0].agora });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
