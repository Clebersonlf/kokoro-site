import { sql } from '../_lib/db.js';
import { exigirAdminMutacao } from '../_lib/kokoro-guard.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      error: 'Método não permitido'
    });
  }

  const sessao = exigirAdminMutacao(req, res);
  if (!sessao) return;

  try {
    const {
      aluno_id,
      referencia,
      descricao = 'Mensalidade',
      valor,
      vencimento,
      status = 'pendente',
      forma_pagamento = '',
      data_pagamento = null,
      observacoes = ''
    } = req.body || {};

    if (!aluno_id || !referencia || valor == null) {
      return res.status(400).json({
        ok: false,
        error: 'Campos obrigatórios: aluno_id, referencia e valor'
      });
    }

    let dataPagamentoFinal = data_pagamento;

    if (String(status).toLowerCase() === 'pago' && !dataPagamentoFinal) {
      dataPagamentoFinal = new Date().toISOString().slice(0, 10);
    }

    if (String(status).toLowerCase() !== 'pago') {
      dataPagamentoFinal = null;
    }

    const rows = await sql`
      INSERT INTO mensalidades_alunos
      (
        aluno_id,
        referencia,
        descricao,
        valor,
        vencimento,
        status,
        forma_pagamento,
        data_pagamento,
        observacoes
      )
      VALUES
      (
        ${aluno_id},
        ${referencia},
        ${descricao},
        ${valor},
        ${vencimento || null},
        ${status},
        ${forma_pagamento},
        ${dataPagamentoFinal},
        ${observacoes}
      )
      RETURNING *
    `;

    return res.status(201).json({
      ok: true,
      mensalidade: rows[0]
    });

  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e.message
    });
  }
}
