import { sql } from '../_lib/db';
import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { parcela_id, data_pagamento } = req.body;

    if (!parcela_id) {
      return res.status(400).json({ ok: false, error: 'parcela_id é obrigatório' });
    }

    // Buscar informações da parcela
    const parcela = await sql`
      SELECT p.*, c.descricao as conta_descricao, c.categoria
      FROM parcelas_a_pagar p
      JOIN contas_a_pagar c ON p.conta_id = c.id
      WHERE p.id = ${parcela_id}
    `;

    if (parcela.length === 0) {
      return res.status(404).json({ ok: false, error: 'Parcela não encontrada' });
    }

    const parcelaInfo = parcela[0];
    const dataPagamentoFinal = data_pagamento || new Date().toISOString().split('T')[0];

    // Criar lançamento no sistema financeiro principal
    const lancamentoId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    
    await sql`
      INSERT INTO financeiro_lancamentos 
      (id, aluno_id, tipo, valor, status, data, created_at, descricao)
      VALUES 
      (${lancamentoId}, null, 'despesa', ${parcelaInfo.valor}, 'pago', ${dataPagamentoFinal}, ${createdAt}, ${`${parcelaInfo.conta_descricao} - Parcela ${parcelaInfo.numero_parcela}`})
    `;

    // Atualizar parcela como paga
    await sql`
      UPDATE parcelas_a_pagar
      SET status = 'paga', 
          data_pagamento = ${dataPagamentoFinal},
          lancamento_id = ${lancamentoId}
      WHERE id = ${parcela_id}
    `;

    res.status(200).json({ 
      ok: true, 
      message: 'Parcela marcada como paga e registrada no sistema financeiro!',
      lancamento_id: lancamentoId
    });

  } catch (error) {
    console.error('Erro ao marcar parcela como paga:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Erro ao marcar parcela como paga', 
      details: error.message 
    });
  }
}
