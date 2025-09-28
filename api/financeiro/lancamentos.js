import { getClient } from '../_lib/db.js';

export default async function handler(req, res) {
  const client = getClient();
  await client.connect();
  try {
    // Garante a tabela (id, tipo, valor etc.)
    await client.sql`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
    `;
    await client.sql`
      CREATE TABLE IF NOT EXISTS financeiro_lancamentos (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        aluno_id   uuid,
        tipo       text NOT NULL CHECK (tipo IN ('receita','despesa')),
        valor      numeric(12,2) NOT NULL,
        descricao  text,
        data       date,
        created_at timestamptz DEFAULT now()
      );
    `;

    if (req.method === 'GET') {
      const { rows } = await client.sql`
        SELECT id, aluno_id, tipo, valor, descricao, data, created_at
        FROM financeiro_lancamentos
        ORDER BY COALESCE(data, created_at) DESC, created_at DESC
      `;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'object' && req.body
        ? req.body
        : {};

      const aluno_id = body.aluno_id ?? null;
      const tipo     = body.tipo;
      const valor    = body.valor;
      const descricao= body.descricao ?? null;
      const data     = body.data ?? null;

      if (!tipo || (valor === undefined || valor === null || isNaN(Number(valor)))) {
        return res.status(400).json({ error: 'Campos obrigatórios: tipo ("receita"|"despesa") e valor numérico.' });
      }

      const { rows } = await client.sql`
        INSERT INTO financeiro_lancamentos (aluno_id, tipo, valor, descricao, data)
        VALUES (${aluno_id}, ${tipo}, ${Number(valor)}, ${descricao}, ${data})
        RETURNING id, aluno_id, tipo, valor, descricao, data, created_at
      `;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(201).json(rows[0]);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(500).json({ ok:false, error: String(e) });
  } finally {
    await client.end();
  }
}
