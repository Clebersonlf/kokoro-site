import { sql } from '../_lib/db.js';

export default async function handler(req, res) {
  if (!['POST', 'PUT'].includes(req.method)) {
    return res.status(405).json({ error: 'Metodo nao permitido' });
  }

  const {
    id,
    numero_certificado,
    titular,
    graduacao,
    data_emissao,
    instituicao = 'Luiz Guinder Team',
    status = 'valido',
    observacoes = ''
  } = req.body || {};

  if (!numero_certificado || !titular || !graduacao || !data_emissao) {
    return res.status(400).json({ error: 'Campos obrigatorios ausentes' });
  }

  try {
    if (req.method === 'PUT') {
      if (!id) {
        return res.status(400).json({ error: 'ID obrigatorio para atualizacao' });
      }

      const r = await sql`
        UPDATE certificados
        SET
          numero_certificado = ${numero_certificado},
          titular = ${titular},
          graduacao = ${graduacao},
          data_emissao = ${data_emissao},
          instituicao = ${instituicao},
          status = ${status},
          observacoes = ${observacoes},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      if (!r.length) {
        return res.status(404).json({ error: 'Certificado nao encontrado' });
      }

      return res.status(200).json(r[0]);
    }

    const r = await sql`
      INSERT INTO certificados (
        numero_certificado,
        titular,
        graduacao,
        data_emissao,
        instituicao,
        status,
        observacoes
      )
      VALUES (
        ${numero_certificado},
        ${titular},
        ${graduacao},
        ${data_emissao},
        ${instituicao},
        ${status},
        ${observacoes}
      )
      RETURNING *
    `;

    return res.status(201).json(r[0]);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
