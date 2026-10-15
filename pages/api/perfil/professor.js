import { sql } from '../_lib/db.js';
import { exigirUsuario } from '../_lib/kokoro-usuario.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Cookie');

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false });
  }

  const usuario = await exigirUsuario(req, res, 'professor');

  if (!usuario) return;

  try {
    const professores = await sql`
      SELECT id, nome, tipo
      FROM professores
      WHERE id = ${usuario.professorId}
        AND ativo = TRUE
      LIMIT 1
    `;

    if (!professores.length) {
      return res.status(401).json({ ok: false });
    }

    return res.status(200).json({
      ok: true,
      professor: professores[0]
    });

  } catch {
    console.error('[perfil/professor] Falha interna');

    return res.status(503).json({
      ok: false,
      error: 'Perfil indisponivel'
    });
  }
}
