import { sql } from '../_lib/db.js';
import { obterSessao } from '../_lib/kokoro-auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ok:false,error:'Metodo nao permitido'});
  }
  res.setHeader('Cache-Control', 'no-store');
  const sessao = obterSessao(req);

  if (!sessao) {
    return res.status(401).json({
      ok: false, error: 'Autenticacao necessaria'
    });
  }

  try {
    let aluno_id;

    if (sessao.role === 'admin') {
      aluno_id = String(req.query.aluno_id || '').trim();

      if (!aluno_id) {
        return res.status(400).json({
          ok: false, error: 'aluno_id obrigatorio'
        });
      }

    } else if (sessao.role === 'aluno') {
      const contas = await sql`
        SELECT aluno_id
        FROM contas_acesso
        WHERE id::text = ${sessao.sub}
          AND perfil = 'aluno'
          AND ativo = TRUE
        LIMIT 1
      `;

      if (!contas.length || !contas[0].aluno_id) {
        return res.status(403).json({
          ok: false, error: 'Acesso nao autorizado'
        });
      }

      aluno_id = contas[0].aluno_id;

    } else {
      return res.status(403).json({
        ok: false, error: 'Acesso nao autorizado'
      });
    }

    const rows = await sql`
      SELECT
        id,
        referencia,
        descricao,
        valor,
        vencimento,
        data_pagamento,
        status,
        forma_pagamento,
        observacoes
      FROM mensalidades_alunos
      WHERE aluno_id = ${aluno_id}
      ORDER BY COALESCE(vencimento, created_at) DESC
      LIMIT 12
    `;

    const mensalidades = sessao.role === 'aluno'
      ? rows.map(({ observacoes, ...m }) => m)
      : rows;

    return res.status(200).json({ ok: true, mensalidades });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
