import { getClient, ensureSchema } from '../_lib/db.js';

export default async function handler(req, res) {
  // Garantir JSON sempre
  res.setHeader('content-type', 'application/json; charset=utf-8');

  const client = getClient();
  await client.connect();
  try {
    await ensureSchema(client);

    if (req.method === 'GET') {
      const { rows } = await client.sql`
        SELECT id, aluno_id, tipo, valor, descricao, data, created_at
        FROM financeiro_lancamentos
        ORDER BY data DESC NULLS LAST, created_at DESC;
      `;
      return res.status(200).send(JSON.stringify(rows));
    }

    if (req.method === 'POST') {
      const { aluno_id, tipo, valor, descricao, data } = req.body ?? {};
      if (!tipo || !valor) {
        return res.status(400).send(JSON.stringify({ error: 'tipo e valor são obrigatórios' }));
      }
      // valida tipo
      if (!['receita','despesa'].includes(String(tipo))) {
        return res.status(400).send(JSON.stringify({ error: "tipo deve ser 'receita' ou 'despesa'" }));
      }

      const { rows } = await client.sql`
        INSERT INTO financeiro_lancamentos (aluno_id, tipo, valor, descricao, data)
        VALUES (${aluno_id ?? null}, ${tipo}, ${valor}, ${descricao ?? null}, ${data ?? null})
        RETURNING id, aluno_id, tipo, valor, descricao, data, created_at;
      `;
      return res.status(201).send(JSON.stringify(rows[0]));
    }

    return res.status(405).send(JSON.stringify({ error: 'method not allowed' }));
  } catch (e) {
    return res.status(500).send(JSON.stringify({ ok:false, error: String(e) }));
  } finally {
    await client.end();
  }
}
