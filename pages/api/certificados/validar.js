import { sql } from '../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodo nao permitido' });
  }

  const codigo = String(req.query.codigo || '').trim();

  if (!codigo) {
    return res.status(400).json({
      ok: false,
      error: 'Codigo do certificado nao informado'
    });
  }

  try {
    const r = await sql`
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
      WHERE LOWER(numero_certificado) = LOWER(${codigo})
      LIMIT 1
    `;

    if (!r.length) {
      return res.status(404).json({
        ok: false,
        localizado: false,
        error: 'Certificado nao localizado'
      });
    }

    return res.status(200).json({
      ok: true,
      localizado: true,
      certificado: r[0]
    });

  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e.message
    });
  }
}
