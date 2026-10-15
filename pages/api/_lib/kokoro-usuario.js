import { sql } from './db.js';
import { obterSessao } from './kokoro-auth.js';

export async function exigirUsuario(
  req, res, perfilEsperado = null
) {
  const sessao = obterSessao(req);

  if (!sessao) {
    res.status(401).json({
      ok: false, error: 'Sessao obrigatoria'
    });
    return null;
  }

  if (
    !['aluno', 'professor'].includes(sessao.role) ||
    (perfilEsperado && sessao.role !== perfilEsperado)
  ) {
    res.status(403).json({
      ok: false, error: 'Perfil nao autorizado'
    });
    return null;
  }

  try {
    const contas = await sql`
      SELECT
        c.id,
        c.perfil,
        c.aluno_id,
        c.professor_id,
        CASE
          WHEN c.perfil = 'aluno' THEN a.nome
          ELSE p.nome
        END AS nome,
        CASE
          WHEN c.perfil = 'aluno' THEN
            a.id IS NOT NULL
            AND LOWER(BTRIM(a.email)) =
                LOWER(BTRIM(c.email))
          ELSE
            p.id IS NOT NULL
            AND p.ativo IS TRUE
            AND LOWER(BTRIM(p.email)) =
                LOWER(BTRIM(c.email))
        END AS vinculo_valido
      FROM contas_acesso c
      LEFT JOIN alunos a ON a.id = c.aluno_id
      LEFT JOIN professores p ON p.id = c.professor_id
      WHERE c.id::text = ${sessao.sub}
        AND c.perfil = ${sessao.role}
        AND c.ativo = TRUE
      LIMIT 1
    `;

    const conta = contas[0];

    if (!conta || !conta.vinculo_valido) {
      res.status(401).json({
        ok: false, error: 'Conta indisponivel'
      });
      return null;
    }

    return {
      perfil: conta.perfil,
      nome: conta.nome,
      alunoId: conta.aluno_id,
      professorId: conta.professor_id
    };

  } catch {
    console.error('[kokoro-usuario] Falha de verificacao');
    res.status(503).json({
      ok: false, error: 'Servico indisponivel'
    });
    return null;
  }
}
