import { sql } from '../_lib/db.js';
import { exigirUsuario } from '../_lib/kokoro-usuario.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Cookie');

  if (req.method !== 'GET') {
    return res.status(405).json({
      ok: false,
      error: 'Metodo nao permitido'
    });
  }

  const usuario = await exigirUsuario(req, res, 'aluno');
  if (!usuario) return;

  const base = String(req.query?.base || '').trim();

  if (!base || base.length > 128) {
    return res.status(400).json({
      ok: false,
      error: 'Numero base invalido'
    });
  }

  try {
    const alunos = await sql`
      SELECT to_jsonb(a) AS dados
      FROM alunos a
      WHERE a.id = ${usuario.alunoId}
      LIMIT 1
    `;

    if (!alunos.length) {
      return res.status(403).json({
        ok: false,
        error: 'Consulta nao autorizada'
      });
    }

    const dados = alunos[0].dados || {};

    const baseAutorizada = String(
      dados.numero_certificado ||
      dados.certificado ||
      dados.numeroCertificado ||
      dados.certificadoNumero ||
      ''
    ).trim();

    if (!baseAutorizada || base !== baseAutorizada) {
      return res.status(403).json({
        ok: false,
        error: 'Consulta nao autorizada'
      });
    }

    const prefixo = baseAutorizada + '-';

    const certificados = await sql`
      SELECT
        numero_certificado,
        graduacao
      FROM certificados
      WHERE starts_with(numero_certificado, ${prefixo})
      ORDER BY data_emissao DESC, numero_certificado DESC
    `;

    return res.status(200).json({
      ok: true,
      certificados
    });

  } catch (e) {
    console.error('[certificados/por-numero-base] Falha interna');

    return res.status(503).json({
      ok: false,
      error: 'Consulta indisponivel'
    });
  }
}
