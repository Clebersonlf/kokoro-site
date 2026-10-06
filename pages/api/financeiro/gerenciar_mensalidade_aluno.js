import { sql } from '../_lib/db.js';

export default async function handler(req, res) {
  try {

    // =========================================================
    // EDITAR / ALTERAR STATUS DA MENSALIDADE
    // =========================================================
    if (req.method === 'PUT') {
      const {
        id,
        referencia,
        descricao,
        valor,
        vencimento,
        status,
        forma_pagamento = '',
        data_pagamento = null,
        observacoes = ''
      } = req.body || {};

      if (!id) {
        return res.status(400).json({
          ok: false,
          error: 'id da mensalidade é obrigatório'
        });
      }

      if (!referencia || valor == null) {
        return res.status(400).json({
          ok: false,
          error: 'referencia e valor são obrigatórios'
        });
      }

      let dataPagamentoFinal = data_pagamento;

      // Ao marcar como pago, registra automaticamente a data
      if (String(status).toLowerCase() === 'pago' && !dataPagamentoFinal) {
        dataPagamentoFinal = new Date().toISOString().slice(0, 10);
      }

      // Se voltar para pendente/vencido, remove a data de pagamento
      if (String(status).toLowerCase() !== 'pago') {
        dataPagamentoFinal = null;
      }

      const rows = await sql`
        UPDATE mensalidades_alunos
        SET
          referencia = ${referencia},
          descricao = ${descricao || 'Mensalidade'},
          valor = ${valor},
          vencimento = ${vencimento || null},
          status = ${status || 'pendente'},
          forma_pagamento = ${forma_pagamento},
          data_pagamento = ${dataPagamentoFinal},
          observacoes = ${observacoes},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      if (!rows.length) {
        return res.status(404).json({
          ok: false,
          error: 'Mensalidade não encontrada'
        });
      }

      return res.status(200).json({
        ok: true,
        mensalidade: rows[0]
      });
    }

    // =========================================================
    // EXCLUIR MENSALIDADE
    // =========================================================
    if (req.method === 'DELETE') {
      const { id } = req.body || {};

      if (!id) {
        return res.status(400).json({
          ok: false,
          error: 'id da mensalidade é obrigatório'
        });
      }

      const rows = await sql`
        DELETE FROM mensalidades_alunos
        WHERE id = ${id}
        RETURNING *
      `;

      if (!rows.length) {
        return res.status(404).json({
          ok: false,
          error: 'Mensalidade não encontrada'
        });
      }

      return res.status(200).json({
        ok: true,
        mensalidade: rows[0]
      });
    }

    return res.status(405).json({
      ok: false,
      error: 'Método não permitido'
    });

  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e.message
    });
  }
}
