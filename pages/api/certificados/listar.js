import { sql } from '../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodo nao permitido' });
  }

  try {
    const certificados = await sql`
      SELECT
        id,
        numero_certificado,
        titular,
        graduacao,
        data_emissao,
        instituicao,
        status,
        observacoes,
        created_at,
        updated_at
      FROM certificados
      ORDER BY data_emissao DESC, created_at DESC
    `;

    return res.status(200).json({ ok: true, certificados });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
