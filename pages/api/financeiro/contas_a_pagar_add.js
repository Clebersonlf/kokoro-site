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
    const { descricao, valor_total, numero_parcelas, primeira_parcela, categoria, observacoes } = req.body;

    // Validações
    if (!descricao || !valor_total || !numero_parcelas || !primeira_parcela) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Campos obrigatórios: descricao, valor_total, numero_parcelas, primeira_parcela' 
      });
    }

    if (numero_parcelas < 1 || numero_parcelas > 60) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Número de parcelas deve estar entre 1 e 60' 
      });
    }

    const valorTotal = parseFloat(valor_total);
    const numeroParcelas = parseInt(numero_parcelas);
    const valorParcela = (valorTotal / numeroParcelas).toFixed(2);

    // Criar conta a pagar
    const contaId = crypto.randomUUID();
    
    await sql`
      INSERT INTO contas_a_pagar 
      (id, descricao, valor_total, numero_parcelas, valor_parcela, primeira_parcela, categoria, observacoes)
      VALUES 
      (${contaId}, ${descricao}, ${valorTotal}, ${numeroParcelas}, ${valorParcela}, ${primeira_parcela}, ${categoria || null}, ${observacoes || null})
    `;

    // Criar parcelas
    const dataPrimeiraParcela = new Date(primeira_parcela);
    
    for (let i = 0; i < numeroParcelas; i++) {
      const dataVencimento = new Date(dataPrimeiraParcela);
      dataVencimento.setMonth(dataVencimento.getMonth() + i);
      
      const parcelaId = crypto.randomUUID();
      
      await sql`
        INSERT INTO parcelas_a_pagar 
        (id, conta_id, numero_parcela, data_vencimento, valor, status)
        VALUES 
        (${parcelaId}, ${contaId}, ${i + 1}, ${dataVencimento.toISOString().split('T')[0]}, ${valorParcela}, 'pendente')
      `;
    }

    res.status(201).json({ 
      ok: true, 
      message: 'Conta parcelada criada com sucesso!',
      conta_id: contaId,
      parcelas_criadas: numeroParcelas
    });

  } catch (error) {
    console.error('Erro ao criar conta parcelada:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Erro ao criar conta parcelada', 
      details: error.message 
    });
  }
}
