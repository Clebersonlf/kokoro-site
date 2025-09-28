import { getClient } from '../_lib/db.js';
import { randomUUID } from 'node:crypto';

export default async function handler(req, res) {
  const client = getClient();
  await client.connect();

  // util p/ garantir que sempre respondemos JSON
  const sendJson = (code, obj) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(code).json(obj);
  };

  // tenta rodar uma query simples; se a tabela não existir, cria uma versão mínima (sem extensões)
  async function ensureFinanceiroTable() {
    try {
      await client.sql`SELECT 1 FROM financeiro_lancamentos LIMIT 1`;
    } catch (e) {
      // se a tabela não existir, criamos uma sem DEFAULT que dependa de extensão
      console.warn('[financeiro] criando tabela básico (fallback):', String(e));
      await client.sql`
        CREATE TABLE IF NOT EXISTS financeiro_lancamentos (
          id         uuid PRIMARY KEY,              -- sem DEFAULT
          aluno_id   uuid,
          tipo       text NOT NULL CHECK (tipo IN ('receita','despesa')),
          valor      numeric(12,2) NOT NULL,
          descricao  text,
          data       date,
          created_at timestamptz DEFAULT now()
        );`;
    }
  }

  try {
    await ensureFinanceiroTable();

    if (req.method === 'GET') {
      const { rows } = await client.sql`
        SELECT id, aluno_id, tipo, valor, descricao, data, created_at
        FROM financeiro_lancamentos
        ORDER BY COALESCE(data, created_at) DESC, created_at DESC
      `;
      return sendJson(200, rows);
    }

    if (req.method === 'POST') {
      let body = req.body;
      // Em serverless às vezes vem string; garantimos objeto
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body || {};

      const aluno_id = body.aluno_id ?? null;
      const tipo     = body.tipo;
      const valor    = body.valor;
      const descricao= body.descricao ?? null;
      const data     = body.data ?? null;

      if (!tipo || (valor === undefined || valor === null || isNaN(Number(valor)))) {
        return sendJson(400, { error: 'Campos obrigatórios: tipo ("receita"|"despesa") e valor numérico.' });
      }

      const id = randomUUID(); // geramos nós o UUID (sem precisar de extensão no banco)
      const { rows } = await client.sql`
        INSERT INTO financeiro_lancamentos (id, aluno_id, tipo, valor, descricao, data)
        VALUES (${id}::uuid, ${aluno_id}, ${tipo}, ${Number(valor)}, ${descricao}, ${data})
        RETURNING id, aluno_id, tipo, valor, descricao, data, created_at
      `;
      return sendJson(201, rows[0]);
    }

    res.setHeader('Allow', 'GET, POST');
    return sendJson(405, { error: 'Method Not Allowed' });
  } catch (e) {
    console.error('[financeiro] erro geral:', e);
    return sendJson(500, { ok: false, error: String(e) });
  } finally {
    await client.end();
  }
}
