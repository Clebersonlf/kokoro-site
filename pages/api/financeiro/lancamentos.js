import { sql } from '../_lib/db';
import crypto from 'crypto';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // List transactions
      const transactions = await sql`
        SELECT * FROM financeiro_lancamentos
        ORDER BY COALESCE(data, created_at) DESC, created_at DESC
        LIMIT 500
      `;
      res.status(200).json({ ok: true, data: transactions });
      
    } else if (req.method === 'POST') {
      // Create new transaction
      const { id, aluno_id, tipo, valor, data } = req.body;

      // Validation
      if (!aluno_id || !tipo || valor == null) {
        return res.status(400).json({ ok: false, error: 'Missing required fields: aluno_id, tipo, valor' });
      }
      if (tipo !== 'receita' && tipo !== 'despesa') {
        return res.status(400).json({ ok: false, error: 'Tipo must be either "receita" or "despesa"' });
      }
      if (typeof valor !== 'number' || valor <= 0) {
        return res.status(400).json({ ok: false, error: 'Valor must be a positive number' });
      }
      if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return res.status(400).json({ ok: false, error: 'Data is required in YYYY-MM-DD format' });       
      }

      const transactionId = id || crypto.randomUUID();
      const status = 'pendente';
      const createdAt = new Date().toISOString();

      await sql`
        INSERT INTO financeiro_lancamentos (id, aluno_id, tipo, valor, status, data, created_at, descricao)
        VALUES (${transactionId}, null, ${tipo}, ${valor}, ${status}, ${data}, ${createdAt}, ${aluno_id})
      `;

      res.status(201).json({ ok: true, data: { id: transactionId } });
      
    } else if (req.method === 'DELETE') {
      // Delete transaction
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ ok: false, error: 'Missing id parameter' });
      }

      await sql`DELETE FROM financeiro_lancamentos WHERE id = ${id}`;
      res.status(200).json({ ok: true });
      
    } else {
      res.setHeader('Allow', 'GET, POST, DELETE');
      res.status(405).json({ ok: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling financeiro_lancamentos:', error);
    res.status(500).json({ ok: false, error: 'Internal server error', details: error.message });
  }
}
