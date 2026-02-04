// server.js (ESM)
// Backend Kokoro — API + Static + Postgres (Neon)

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import alunosComplete from './api/alunos/complete.js';

// ========================
// Setup básico
// ========================
const app = express();
app.use(express.json());
app.use(cors({ origin: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================
// Banco de dados (Neon / Postgres)
// ========================
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não definida no .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function q(text, params) {
  return pool.query(text, params);
}

// ========================
// Arquivos estáticos
// ========================
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_req, res) => {
  res.redirect('/home.html');
});

// ========================
// Health check
// ========================
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'kokoro-backend',
    status: 'online',
    time: new Date().toISOString()
  });
});

// ========================
// API Financeiro (REAL - Postgres)
// ========================

// LISTAR lançamentos
app.get('/api/financeiro/lancamentos', async (_req, res) => {
  try {
    const r = await q(`
      SELECT
        id,
        aluno_id,
        graduacao_id,
        tipo,
        valor,
        status,
        data,
        descricao,
        obs,
        created_at
      FROM financeiro_lancamentos
      ORDER BY data DESC, created_at DESC
      LIMIT 500
    `);

    res.json(r.rows);
  } catch (err) {
    console.error('❌ GET financeiro_lancamentos:', err);
    res.status(500).json({ ok: false, error: 'Erro ao listar lançamentos' });
  }
});

// CRIAR lançamento
app.post('/api/financeiro/lancamentos', async (req, res) => {
  try {
    const { data, tipo, valor, descricao = null, aluno_id = null } = req.body || {};

    const v = Number(valor);

    if (!data || !tipo || !Number.isFinite(v) || v <= 0) {
      return res.status(400).json({ ok: false, error: 'Dados inválidos' });
    }

    if (!['receita', 'despesa'].includes(tipo)) {
      return res.status(400).json({ ok: false, error: 'Tipo inválido' });
    }

    const status = 'pago';

    const r = await q(
      `
      INSERT INTO financeiro_lancamentos
        (aluno_id, tipo, valor, status, data, descricao)
      VALUES
        ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        aluno_id,
        graduacao_id,
        tipo,
        valor,
        status,
        data,
        descricao,
        obs,
        created_at
      `,
      [aluno_id, tipo, v, status, data, descricao]
    );

    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('❌ POST financeiro_lancamentos:', err);
    res.status(500).json({ ok: false, error: 'Erro ao salvar lançamento' });
  }
});

// EDITAR lançamento (por ID)
app.put('/api/financeiro/lancamentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      data,
      tipo,
      valor,
      descricao = null,
      aluno_id = null,
      status = null,
      obs = null
    } = req.body || {};

    if (!id) {
      return res.status(400).json({ ok: false, error: 'ID inválido' });
    }

    if (tipo != null && !['receita', 'despesa'].includes(tipo)) {
      return res.status(400).json({ ok: false, error: 'Tipo inválido' });
    }

    let v = null;
    if (valor != null) {
      v = Number(valor);
      if (!Number.isFinite(v) || v <= 0) {
        return res.status(400).json({ ok: false, error: 'Valor inválido' });
      }
    }

    const r = await q(
      `
      UPDATE financeiro_lancamentos
      SET
        data      = COALESCE($2, data),
        tipo      = COALESCE($3, tipo),
        valor     = COALESCE($4, valor),
        descricao = COALESCE($5, descricao),
        aluno_id  = COALESCE($6, aluno_id),
        status    = COALESCE($7, status),
        obs       = COALESCE($8, obs)
      WHERE id = $1
      RETURNING
        id,
        aluno_id,
        graduacao_id,
        tipo,
        valor,
        status,
        data,
        descricao,
        obs,
        created_at
      `,
      [id, data || null, tipo || null, v, descricao, aluno_id, status, obs]
    );

    if (r.rowCount === 0) {
      return res.status(404).json({ ok: false, error: 'Lançamento não encontrado' });
    }

    res.json({ ok: true, lancamento: r.rows[0] });
  } catch (err) {
    console.error('❌ PUT financeiro_lancamentos:', err);
    res.status(500).json({ ok: false, error: 'Erro ao editar lançamento' });
  }
});

// ========================
// Healthcheck
// ========================
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'kokoro-backend',
    time: new Date().toISOString()
  });
});


// ========================
// Subir servidor
// ========================
const PORT = process.env.PORT || 3000;

app.all('/api/alunos/complete', (req, res) => alunosComplete(req, res));

app.listen(PORT, () => {
  console.log(`✅ Kokoro backend rodando em http://localhost:${PORT}`);
});

