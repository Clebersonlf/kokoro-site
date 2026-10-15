import { sql } from '../_lib/db.js';
import { exigirAdmin } from '../_lib/kokoro-auth.js';

export default async function handler(req, res) {

  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Cookie');

  if (req.method !== 'GET') {
    return res.status(405).json({
      ok: false,
      error: 'Metodo nao permitido'
    });
  }

  const sessao = exigirAdmin(req, res);
  if (!sessao) return;

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
