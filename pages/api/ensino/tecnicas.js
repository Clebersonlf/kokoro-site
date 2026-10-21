import { sql } from '../_lib/db.js';
import { obterSessao } from '../_lib/kokoro-auth.js';
import { exigirUsuario } from '../_lib/kokoro-usuario.js';

function campo(dados, nome, maximo) {
  const valor = dados[nome];
  if (valor !== undefined && typeof valor !== 'string') return null;
  const texto = (valor || '').trim();
  return texto.length <= maximo ? texto : null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Cookie');

  if (!['GET', 'POST', 'PATCH'].includes(req.method)) {
    return res.status(405).json({ ok: false });
  }

  const sessao = obterSessao(req);
  if (!sessao) return res.status(401).json({ ok: false });

  let professorId = null;
  let tipoProfessor = null;

  if (sessao.role === 'professor') {
    const usuario = await exigirUsuario(req, res, 'professor');
    if (!usuario) return;

    professorId = usuario.professorId;

    try {
      const linhas = await sql`
        SELECT tipo FROM professores
        WHERE id = ${professorId} AND ativo = TRUE
        LIMIT 1
      `;

      const tipo = String(linhas[0]?.tipo || '').toUpperCase();

      if (!['TITULAR', 'AUXILIAR'].includes(tipo)) {
        return res.status(403).json({ ok: false });
      }

      tipoProfessor = tipo;
    } catch {
      return res.status(503).json({ ok: false });
    }
  } else if (sessao.role !== 'admin') {
    return res.status(403).json({ ok: false });
  }

  try {
    if (req.method === 'GET') {
      const busca = String(req.query.busca || '').trim();
      const pagina = Number(req.query.pagina || 1);

      if (
        busca.length > 100 ||
        !Number.isSafeInteger(pagina) ||
        pagina < 1 ||
        pagina > 100
      ) {
        return res.status(400).json({ ok: false });
      }

      const limite = 100;
      const deslocamento = (pagina - 1) * limite;
      let tecnicas;

      if (busca) {
        const termo = '%' + busca + '%';

        tecnicas = await sql`
          SELECT id, nome, categoria, subcategoria,
                 regiao_corpo, posicao_origem,
                 descricao_curta, descricao_detalhada,
                 imagem_url
          FROM kokoro_tecnicas
          WHERE ativo = TRUE
            AND (
              nome ILIKE ${termo}
              OR categoria ILIKE ${termo}
              OR COALESCE(subcategoria, '') ILIKE ${termo}
              OR COALESCE(posicao_origem, '') ILIKE ${termo}
            )
          ORDER BY categoria, nome
          LIMIT ${limite} OFFSET ${deslocamento}
        `;
      } else {
        tecnicas = await sql`
          SELECT id, nome, categoria, subcategoria,
                 regiao_corpo, posicao_origem,
                 descricao_curta, descricao_detalhada,
                 imagem_url
          FROM kokoro_tecnicas
          WHERE ativo = TRUE
          ORDER BY categoria, nome
          LIMIT ${limite} OFFSET ${deslocamento}
        `;
      }

      return res.status(200).json({
        ok: true, tecnicas, pagina, limite
      });
    }

    if (
      sessao.role !== 'admin' &&
      tipoProfessor !== 'TITULAR'
    ) {
      return res.status(403).json({
        ok: false,
        error: 'Operacao reservada ao titular ou administrador'
      });
    }

    const origem = req.headers.origin;

    if (!origem || req.headers['sec-fetch-site'] === 'cross-site') {
      return res.status(403).json({ ok: false });
    }

    let mesmaOrigem = false;

    try {
      const endereco = new URL(origem);
      mesmaOrigem =
        ['http:', 'https:'].includes(endereco.protocol) &&
        endereco.host === req.headers.host;
    } catch {
      mesmaOrigem = false;
    }

    if (!mesmaOrigem) {
      return res.status(403).json({ ok: false });
    }

    if (
      !String(req.headers['content-type'] || '')
        .toLowerCase().startsWith('application/json') ||
      !req.body ||
      typeof req.body !== 'object' ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({ ok: false });
    }

    const dados = req.body;
    const nome = campo(dados, 'nome', 160);
    const categoria = campo(dados, 'categoria', 100);
    const subcategoria = campo(dados, 'subcategoria', 100);
    const regiao = campo(dados, 'regiao_corpo', 100);
    const posicao = campo(dados, 'posicao_origem', 160);
    const curta = campo(dados, 'descricao_curta', 1000);
    const detalhada = campo(dados, 'descricao_detalhada', 12000);

    if (
      !nome || !categoria ||
      [subcategoria, regiao, posicao, curta, detalhada]
        .some(valor => valor === null)
    ) {
      return res.status(400).json({
        ok: false, error: 'Dados da tecnica invalidos'
      });
    }


    const imagem = campo(dados, 'imagem_url', 1500);

    if (imagem === null) {
      return res.status(400).json({
        ok: false,
        error: 'Endereco de imagem invalido'
      });
    }

    let imagemUrl = null;

    if (imagem) {
      try {
        const url = new URL(imagem);
        if (
          !['http:', 'https:'].includes(url.protocol) ||
          url.username ||
          url.password
        ) {
          throw new Error('URL invalida');
        }
        imagemUrl = url.href;
      } catch {
        return res.status(400).json({
          ok: false,
          error: 'Informe uma URL HTTP ou HTTPS valida'
        });
      }
    }

    if (req.method === 'PATCH') {
      const id = typeof dados.id === 'string'
        ? dados.id.trim()
        : '';

      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      ) {
        return res.status(400).json({
          ok: false,
          error: 'Identificador invalido'
        });
      }

      const duplicadas = await sql`
        SELECT id
        FROM kokoro_tecnicas
        WHERE id <> ${id}::uuid
          AND ativo = TRUE
          AND LOWER(BTRIM(nome)) = LOWER(BTRIM(${nome}))
          AND LOWER(BTRIM(categoria)) = LOWER(BTRIM(${categoria}))
        LIMIT 1
      `;

      if (duplicadas.length) {
        return res.status(409).json({
          ok: false,
          error: 'Ja existe tecnica com esse nome e categoria'
        });
      }

      const linhas = await sql`
        UPDATE kokoro_tecnicas
        SET nome = ${nome},
            categoria = ${categoria},
            subcategoria = ${subcategoria || null},
            regiao_corpo = ${regiao || null},
            posicao_origem = ${posicao || null},
            descricao_curta = ${curta || null},
            descricao_detalhada = ${detalhada || null},
            imagem_url = ${imagemUrl},
            atualizado_em = NOW()
        WHERE id = ${id}::uuid
          AND ativo = TRUE
        RETURNING id, nome, categoria, subcategoria,
                  regiao_corpo, posicao_origem,
                  descricao_curta, descricao_detalhada,
                  imagem_url
      `;

      if (!linhas.length) {
        return res.status(404).json({
          ok: false,
          error: 'Tecnica nao encontrada'
        });
      }

      return res.status(200).json({
        ok: true,
        tecnica: linhas[0]
      });
    }

    const existentes = await sql`
      SELECT id FROM kokoro_tecnicas
      WHERE LOWER(nome) = LOWER(${nome})
        AND LOWER(categoria) = LOWER(${categoria})
        AND ativo = TRUE
      LIMIT 1
    `;

    if (existentes.length) {
      return res.status(409).json({
        ok: false, error: 'Tecnica ja cadastrada nesta categoria'
      });
    }

    const linhas = await sql`
      INSERT INTO kokoro_tecnicas
        (nome, categoria, subcategoria, regiao_corpo,
         posicao_origem, descricao_curta,
         descricao_detalhada, imagem_url, criado_por)
      VALUES
        (${nome}, ${categoria}, ${subcategoria},
         ${regiao}, ${posicao}, ${curta},
         ${detalhada}, ${imagemUrl}, ${professorId})
      RETURNING id, nome, categoria, subcategoria
    `;

    return res.status(201).json({
      ok: true, tecnica: linhas[0]
    });
  } catch {
    console.error('[ensino/tecnicas] Falha interna');
    return res.status(503).json({
      ok: false, error: 'Operacao indisponivel'
    });
  }
}
