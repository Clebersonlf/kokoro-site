import { getClient, ensureSchema } from '../_lib/db.js';

// util: resposta JSON sempre
function sendJson(res, code, obj) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(code).json(obj);
}

// util: timeout p/ qualquer promise
function withTimeout(promise, ms=10000) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms`)), ms)),
  ]);
}

export default async function handler(req, res) {
  const client = getClient();
  await client.connect();

  try {
    // Usa o mesmo caminho que já funcionou em /api/test/db
    await withTimeout(ensureSchema(client), 8000);

    // garante tabela (sem EXTENSION)
    await withTimeout(client.sql`
      CREATE TABLE IF NOT EXISTS financeiro_lancamentos (
        id         uuid PRIMARY KEY,
        aluno_id   uuid,
        tipo       text NOT NULL CHECK (tipo IN ('receita','despesa')),
        valor      numeric(12,2) NOT NULL,
        descricao  text,
        data       date,
        created_at timestamptz DEFAULT now()
      );
    `, 8000);

    if (req.method === 'GET') {
      const { rows } = await withTimeout(client.sql`
        SELECT id, aluno_id, tipo, valor, descricao, data, created_at
        FROM financeiro_lancamentos
        ORDER BY COALESCE(data, created_at) DESC, created_at DESC
      `, 8000);
      return sendJson(res, 200, rows);
    }

    if (req.method === 'POST') {
      const body = (typeof req.body === 'object' && req.body)
        ? req.body
        : (() => { try { return JSON.parse(req.body || '{}'); } catch { return {}; } })();

      const aluno_id  = body.aluno_id ?? null;
      const tipo      = body.tipo;
      const valor     = Number(body.valor);
      const descricao = body.descricao ?? null;
      const data      = body.data ?? null;

      if (!tipo || Number.isNaN(valor)) {
        return sendJson(res, 400, { error: 'Campos obrigatórios: tipo ("receita"|"despesa") e valor numérico.' });
      }

      // id gerado no Node para não depender de EXTENSION
      const id = crypto.randomUUID?.() ?? (await import('node:crypto')).randomUUID();

      const { rows } = await withTimeout(client.sql`
        INSERT INTO financeiro_lancamentos (id, aluno_id, tipo, valor, descricao, data)
        VALUES (${id}, ${aluno_id}, ${tipo}, ${valor}, ${descricao}, ${data})
        RETURNING id, aluno_id, tipo, valor, descricao, data, created_at
      `, 8000);
      return sendJson(res, 201, rows[0]);
    }

    res.setHeader('Allow', 'GET, POST');
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  } catch (e) {
    return sendJson(res, 500, { ok: false, where: 'financeiro/lancamentos', error: String(e) });
  } finally {
    await client.end();
  }
}
