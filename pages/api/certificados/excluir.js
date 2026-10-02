import { sql } from '../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo nao permitido' });
  }

  const { id } = req.body || {};

  if (!id) {
    return res.status(400).json({ error: 'ID obrigatorio' });
  }

  try {
    const r = await sql`
      DELETE FROM certificados
      WHERE id = ${id}
      RETURNING *
    `;

    if (!r.length) {
      return res.status(404).json({ error: 'Certificado nao encontrado' });
    }

    return res.status(200).json({ ok: true, certificado: r[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
