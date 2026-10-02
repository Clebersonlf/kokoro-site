import { sql } from '../_lib/db.js';

export default async function handler(req, res) {
  try {
    const cols = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'certificados'
      ORDER BY ordinal_position
    `;

    return res.status(200).json({
      ok: true,
      colunas: cols.map(c => c.column_name)
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
