import { sql } from '../_lib/db.js';
import { obterSessao } from '../_lib/kokoro-auth.js';
import { exigirUsuario } from '../_lib/kokoro-usuario.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Cookie');

  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ ok: false });
  }

  const sessao = obterSessao(req);

  if (!sessao) {
    return res.status(401).json({
      ok: false,
      error: 'Autenticacao necessaria'
    });
  }

  let acesso = null;

  if (sessao.role === 'admin') {
    acesso = { perfil: 'admin', geral: true };
  } else if (sessao.role === 'professor') {
    const usuario = await exigirUsuario(req, res, 'professor');
    if (!usuario) return;

    try {
      const linhas = await sql`
        SELECT tipo
        FROM professores
        WHERE id = ${usuario.professorId}
          AND ativo = TRUE
        LIMIT 1
      `;

      const tipo = String(linhas[0]?.tipo || '')
        .trim().toUpperCase();

      if (!['TITULAR', 'AUXILIAR'].includes(tipo)) {
        return res.status(403).json({ ok: false });
      }

      acesso = {
        perfil: 'professor',
        id: usuario.professorId,
        tipo,
        geral: tipo === 'TITULAR'
      };
    } catch {
      return res.status(503).json({
        ok: false,
        error: 'Verificacao indisponivel'
      });
    }
  } else {
    return res.status(403).json({ ok: false });
  }

  try {
    if (req.method === 'GET') {
      let planos;

      if (acesso.geral) {
        planos = await sql`
          SELECT id, professor_id, titulo, data_aula,
                 turma_descricao, objetivos, conteudo_livre,
                 status, criado_em
          FROM kokoro_planos_aula
          ORDER BY data_aula DESC, criado_em DESC
          LIMIT 100
        `;
      } else {
        planos = await sql`
          SELECT id, professor_id, titulo, data_aula,
                 turma_descricao, objetivos, conteudo_livre,
                 status, criado_em
          FROM kokoro_planos_aula
          WHERE professor_id = ${acesso.id}
          ORDER BY data_aula DESC, criado_em DESC
          LIMIT 100
        `;
      }

      return res.status(200).json({
        ok: true,
        planos
      });
    }

    if (acesso.perfil !== 'professor') {
      return res.status(403).json({ ok: false });
    }

    const origem = req.headers.origin;

    if (req.headers['sec-fetch-site'] === 'cross-site' ||
        (origem && new URL(origem).host !== req.headers.host)) {
      return res.status(403).json({ ok: false });
    }

    const dados = req.body || {};
    const titulo = String(dados.titulo || '').trim();
    const data = String(dados.data_aula || '').trim();
    const turma = String(dados.turma_descricao || '').trim();
    const objetivos = String(dados.objetivos || '').trim();
    const conteudo = String(dados.conteudo_livre || '').trim();

    const dataValida = /^\d{4}-\d{2}-\d{2}$/.test(data) &&
      !Number.isNaN(Date.parse(data)) &&
      new Date(data).toISOString().slice(0, 10) === data;

    if (!titulo || titulo.length > 160 ||
        !dataValida || turma.length > 160 ||
        objetivos.length > 4000 ||
        conteudo.length > 12000) {
      return res.status(400).json({
        ok: false,
        error: 'Dados do plano invalidos'
      });
    }

    const linhas = await sql`
      INSERT INTO kokoro_planos_aula
        (professor_id, titulo, data_aula,
         turma_descricao, objetivos, conteudo_livre,
         status)
      VALUES
        (${acesso.id}, ${titulo}, ${data},
         ${turma}, ${objetivos}, ${conteudo},
         'rascunho')
      RETURNING id, titulo, data_aula, status
    `;

    return res.status(201).json({
      ok: true,
      plano: linhas[0]
    });

  } catch {
    console.error('[ensino/planos] Falha na operacao');

    return res.status(503).json({
      ok: false,
      error: 'Operacao indisponivel'
    });
  }
}
