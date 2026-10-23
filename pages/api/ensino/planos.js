import { sql } from '../_lib/db.js';
import { obterSessao } from '../_lib/kokoro-auth.js';
import { exigirUsuario } from '../_lib/kokoro-usuario.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Cookie');

  if (!['GET', 'POST', 'PATCH'].includes(req.method)) {
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
          SELECT p.id, p.professor_id, p.titulo, p.data_aula,
                 p.turma_descricao, p.objetivos, p.conteudo_livre,
                 p.status, p.criado_em,
                 COALESCE((
                   SELECT jsonb_agg(
                     jsonb_build_object(
                       'tecnica_id', pt.tecnica_id,
                       'nome', pt.nome_tecnica_snapshot,
                       'descricao_ministrada',
                       pt.descricao_ministrada
                     )
                     ORDER BY pt.ordem, pt.id
                   )
                   FROM kokoro_plano_tecnicas pt
                   WHERE pt.plano_id = p.id
                 ), '[]'::jsonb) AS tecnicas
          FROM kokoro_planos_aula p
          ORDER BY data_aula DESC, criado_em DESC
          LIMIT 100
        `;
      } else {
        planos = await sql`
          SELECT p.id, p.professor_id, p.titulo, p.data_aula,
                 p.turma_descricao, p.objetivos, p.conteudo_livre,
                 p.status, p.criado_em,
                 COALESCE((
                   SELECT jsonb_agg(
                     jsonb_build_object(
                       'tecnica_id', pt.tecnica_id,
                       'nome', pt.nome_tecnica_snapshot,
                       'descricao_ministrada',
                       pt.descricao_ministrada
                     )
                     ORDER BY pt.ordem, pt.id
                   )
                   FROM kokoro_plano_tecnicas pt
                   WHERE pt.plano_id = p.id
                 ), '[]'::jsonb) AS tecnicas
          FROM kokoro_planos_aula p
          WHERE professor_id = ${acesso.id}
          ORDER BY data_aula DESC, criado_em DESC
          LIMIT 100
        `;
      }

      return res.status(200).json({
        ok: true,
        planos: planos.map(plano => ({
          ...plano,
          pode_editar:
            acesso.perfil === 'professor' &&
            String(plano.professor_id).toLowerCase() ===
              String(acesso.id).toLowerCase() &&
            plano.status === 'rascunho'
        }))
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

    const tecnicas = dados.tecnicas === undefined
      ? [] : dados.tecnicas;

    if (!Array.isArray(tecnicas) || tecnicas.length > 30) {
      return res.status(400).json({
        ok: false, error: 'Lista de tecnicas invalida'
      });
    }

    const ids = new Set();
    const selecionadas = [];

    for (const item of tecnicas) {
      if (!item || typeof item !== 'object' ||
          Array.isArray(item)) {
        return res.status(400).json({
          ok: false, error: 'Tecnica selecionada invalida'
        });
      }

      const id = item.tecnica_id;
      const descricao = item.descricao_ministrada ?? '';

      if (
        typeof id !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
        ids.has(id.toLowerCase()) ||
        typeof descricao !== 'string' ||
        descricao.length > 6000
      ) {
        return res.status(400).json({
          ok: false, error: 'Dados das tecnicas invalidos'
        });
      }

      ids.add(id.toLowerCase());
      selecionadas.push({
        tecnica_id: id,
        descricao_ministrada: descricao.trim()
      });
    }

    const tecnicasJson = JSON.stringify(selecionadas);

    if (req.method === 'PATCH') {
      const planoId = String(dados.plano_id || '').trim();

      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planoId)) {
        return res.status(400).json({
          ok: false,
          error: 'Identificador do plano invalido'
        });
      }

      // Atualizacao e substituicao das tecnicas
      // em uma unica instrucao atomica.
      // Apenas o autor pode editar um rascunho.
      const linhas = await sql`
        WITH entradas AS (
          SELECT
            (x.item->>'tecnica_id')::uuid AS tecnica_id,
            COALESCE(
              x.item->>'descricao_ministrada', ''
            ) AS descricao_ministrada,
            x.ordem::integer AS ordem
          FROM jsonb_array_elements(
            ${tecnicasJson}::jsonb
          ) WITH ORDINALITY AS x(item, ordem)
        ),
        validas AS (
          SELECT
            t.id AS tecnica_id,
            t.nome,
            e.descricao_ministrada,
            e.ordem
          FROM entradas e
          JOIN kokoro_tecnicas t
            ON t.id = e.tecnica_id
           AND t.ativo = TRUE
        ),
        atualizado AS (
          UPDATE kokoro_planos_aula p
          SET
            titulo = ${titulo},
            data_aula = ${data}::date,
            turma_descricao = ${turma},
            objetivos = ${objetivos},
            conteudo_livre = ${conteudo},
            atualizado_em = NOW()
          WHERE p.id = ${planoId}::uuid
            AND p.professor_id = ${acesso.id}::uuid
            AND p.status = 'rascunho'
            AND (
              SELECT COUNT(*) FROM validas
            ) = ${selecionadas.length}
          RETURNING
            p.id, p.titulo, p.data_aula, p.status
        ),
        removidas AS (
          DELETE FROM kokoro_plano_tecnicas pt
          USING atualizado a
          WHERE pt.plano_id = a.id
          RETURNING pt.id
        ),
        novas AS (
          INSERT INTO kokoro_plano_tecnicas
            (plano_id, tecnica_id, nome_tecnica_snapshot,
             descricao_ministrada, ordem)
          SELECT
            a.id,
            v.tecnica_id,
            v.nome,
            v.descricao_ministrada,
            v.ordem
          FROM atualizado a
          CROSS JOIN validas v
          WHERE (SELECT COUNT(*) FROM removidas) >= 0
          RETURNING id
        )
        SELECT
          a.id,
          a.titulo,
          a.data_aula,
          a.status,
          (
            SELECT COUNT(*) FROM novas
          )::integer AS quantidade_tecnicas
        FROM atualizado a
      `;

      if (!linhas.length) {
        return res.status(409).json({
          ok: false,
          error: 'Plano indisponivel para edicao, sem permissao ou com tecnicas invalidas'
        });
      }

      return res.status(200).json({
        ok: true,
        plano: linhas[0]
      });
    }

    // Uma unica instrucao SQL evita salvar um plano
    // incompleto caso alguma tecnica esteja indisponivel.
    const linhas = await sql`
      WITH entradas AS (
        SELECT
          (x.item->>'tecnica_id')::uuid AS tecnica_id,
          COALESCE(
            x.item->>'descricao_ministrada', ''
          ) AS descricao_ministrada,
          x.ordem::integer AS ordem
        FROM jsonb_array_elements(
          ${tecnicasJson}::jsonb
        ) WITH ORDINALITY AS x(item, ordem)
      ),
      validas AS (
        SELECT
          t.id AS tecnica_id,
          t.nome,
          e.descricao_ministrada,
          e.ordem
        FROM entradas e
        JOIN kokoro_tecnicas t
          ON t.id = e.tecnica_id
         AND t.ativo = TRUE
      ),
      novo_plano AS (
        INSERT INTO kokoro_planos_aula
          (professor_id, titulo, data_aula,
           turma_descricao, objetivos, conteudo_livre,
           status)
        SELECT
          ${acesso.id}::uuid,
          ${titulo},
          ${data}::date,
          ${turma},
          ${objetivos},
          ${conteudo},
          'rascunho'
        WHERE (
          SELECT COUNT(*) FROM validas
        ) = ${selecionadas.length}
        RETURNING id, titulo, data_aula, status
      ),
      itens_criados AS (
        INSERT INTO kokoro_plano_tecnicas
          (plano_id, tecnica_id, nome_tecnica_snapshot,
           descricao_ministrada, ordem)
        SELECT
          p.id,
          v.tecnica_id,
          v.nome,
          v.descricao_ministrada,
          v.ordem
        FROM novo_plano p
        CROSS JOIN validas v
        RETURNING id
      )
      SELECT
        p.id,
        p.titulo,
        p.data_aula,
        p.status,
        (
          SELECT COUNT(*) FROM itens_criados
        )::integer AS quantidade_tecnicas
      FROM novo_plano p
    `;

    if (!linhas.length) {
      return res.status(400).json({
        ok: false,
        error: 'Uma ou mais tecnicas nao estao disponiveis'
      });
    }

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
