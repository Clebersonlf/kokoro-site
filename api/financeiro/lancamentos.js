const { sql } = require('../_lib/db.js');
const { randomUUID } = require('node:crypto');

/* ========= helpers ========= */
function send(res, code, obj){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  return res.status(code).json(obj);
}

const withTimeout = (p, ms = 10000) =>
  Promise.race([
    p,
    new Promise((_, r) => setTimeout(() => r(new Error(`timeout ${ms}ms`)), ms))
  ]);

function fmtDateISO(d){
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  return dt.toISOString().slice(0,10); // YYYY-MM-DD
}

function normalizeRows(rows){
  return rows.map(r => ({
    id:         r.id,
    aluno_id:   r.aluno_id ?? null,
    tipo:       r.tipo,
    valor:      r.valor != null ? Number(r.valor) : null,
    descricao:  r.descricao ?? null,
    data:       fmtDateISO(r.data),
    created_at: r.created_at
  }));
}

async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS financeiro_lancamentos (
      id         uuid PRIMARY KEY,
      aluno_id   uuid,
      tipo       text,
      valor      numeric(12,2),
      descricao  text,
      data       date,
      created_at timestamptz DEFAULT now()
    );
  `;

  await sql`ALTER TABLE financeiro_lancamentos ADD COLUMN IF NOT EXISTS aluno_id   uuid;`;
  await sql`ALTER TABLE financeiro_lancamentos ADD COLUMN IF NOT EXISTS tipo       text;`;
  await sql`ALTER TABLE financeiro_lancamentos ADD COLUMN IF NOT EXISTS valor      numeric(12,2);`;
  await sql`ALTER TABLE financeiro_lancamentos ADD COLUMN IF NOT EXISTS descricao  text;`;
  await sql`ALTER TABLE financeiro_lancamentos ADD COLUMN IF NOT EXISTS data       date;`;
  await sql`ALTER TABLE financeiro_lancamentos ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();`;

  await sql`ALTER TABLE financeiro_lancamentos ALTER COLUMN aluno_id DROP NOT NULL;`;

  await sql`UPDATE financeiro_lancamentos SET tipo='receita' WHERE tipo IS NULL;`;
  await sql`UPDATE financeiro_lancamentos SET valor=0 WHERE valor IS NULL;`;

  await sql`ALTER TABLE financeiro_lancamentos ALTER COLUMN tipo  SET NOT NULL;`;
  await sql`ALTER TABLE financeiro_lancamentos ALTER COLUMN valor SET NOT NULL;`;

  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ck_financeiro_tipo'
      ) THEN
        ALTER TABLE financeiro_lancamentos
          ADD CONSTRAINT ck_financeiro_tipo CHECK (tipo IN ('receita','despesa'));
      END IF;
    END$$;
  `;
}

/* ========= handler ========= */
module.exports = async function handler(req, res) {
  try {
    await withTimeout(ensureSchema(), 15000);

    if (req.method === 'GET') {
      const { rows } = await withTimeout(sql`
        SELECT id, aluno_id, tipo, valor, descricao, data, created_at
        FROM financeiro_lancamentos
        ORDER BY COALESCE(data, created_at) DESC, created_at DESC
      `, 8000);
      return send(res, 200, normalizeRows(rows));
    }

    if (req.method === 'POST') {
      // 🔓 SEM ADMIN_SECRET por enquanto — liberado pra testes

      let body = req.body;
      if (typeof body !== 'object' || !body) {
        try { body = JSON.parse(req.body || '{}'); } catch { body = {}; }
      }

      const aluno_id  = body.aluno_id ?? null;
      const tipo      = (body.tipo || '').toString().trim();
      const valorNum  = Number(body.valor);
      const descricao = body.descricao ?? null;
      const data      = body.data ?? null;

      const tiposValidos = new Set(['receita','despesa']);
      if (!tiposValidos.has(tipo)) {
        return send(res, 400, { error: 'tipo inválido: use "receita" ou "despesa"' });
      }
      if (!isFinite(valorNum)) {
        return send(res, 400, { error: 'valor inválido: precisa ser numérico' });
      }
      if (valorNum <= 0) {
        return send(res, 400, { error: 'valor deve ser maior que 0' });
      }

      const id = randomUUID();
      const { rows } = await withTimeout(sql`
        INSERT INTO financeiro_lancamentos (id, aluno_id, tipo, valor, descricao, data)
        VALUES (${id}, ${aluno_id}, ${tipo}, ${valorNum}, ${descricao}, ${data})
        RETURNING id, aluno_id, tipo, valor, descricao, data, created_at
      `, 8000);

      return send(res, 201, normalizeRows(rows)[0]);
    }

    res.setHeader('Allow', 'GET, POST');
    return send(res, 405, { error:'Method Not Allowed' });
  } catch (e) {
    return send(res, 500, { ok:false, error:String(e) });
  }
};
