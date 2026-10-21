import { obterSessao } from '../_lib/kokoro-auth.js';
import { exigirUsuario } from '../_lib/kokoro-usuario.js';
import { sql } from '../_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Cookie');

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false });
  }

  const sessao = obterSessao(req);

  if (!sessao) {
    return res.status(401).json({ ok: false });
  }

  if (sessao.role === 'admin') {
    return res.status(200).json({
      ok: true,
      perfil: 'admin',
      podeCriarPlano: false,
      podeCriarTecnica: true,
      podeEditarTecnica: true,
      podeAvaliar: false,
      podeConsultarBiblioteca: true,
      podeConsultarRelatoriosGerais: true
    });
  }

  if (sessao.role !== 'professor') {
    return res.status(403).json({ ok: false });
  }

  const usuario = await exigirUsuario(req, res, 'professor');
  if (!usuario) return;

  try {
    const professores = await sql`
      SELECT tipo
      FROM professores
      WHERE id = ${usuario.professorId}
        AND ativo = TRUE
      LIMIT 1
    `;

    const tipo = String(
      professores[0]?.tipo || ''
    ).trim().toUpperCase();

    if (!['TITULAR', 'AUXILIAR'].includes(tipo)) {
      return res.status(403).json({ ok: false });
    }

    return res.status(200).json({
      ok: true,
      perfil: 'professor',
      tipo,
      podeCriarPlano: true,
      podeCriarTecnica: tipo === 'TITULAR',
      podeEditarTecnica: tipo === 'TITULAR',
      podeAvaliar: true,
      podeConsultarBiblioteca: true,
      podeConsultarRelatoriosGerais: tipo === 'TITULAR'
    });

  } catch {
    console.error('[ensino/permissoes] Falha interna');
    return res.status(503).json({
      ok: false,
      error: 'Servico indisponivel'
    });
  }
}
