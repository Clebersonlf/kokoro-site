import { sql } from '../_lib/db.js';

export default async function handler(req, res) {
  try {
    const base = String(req.query.base || '').trim();

    if (!base) {
      return res.status(400).json({ ok: false, error: 'Número base obrigatório' });
    }

    const certificados = await sql`
      SELECT
        id,
        numero_certificado,
        titular,
        graduacao,
        data_emissao,
        instituicao,
        status,
        observacoes
      FROM certificados
      WHERE numero_certificado LIKE ${base + '-%'}
      ORDER BY data_emissao DESC, numero_certificado DESC
    `;

    return res.status(200).json({ ok: true, certificados });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
