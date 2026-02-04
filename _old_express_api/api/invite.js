import crypto from "crypto";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método não permitido" });
  }

  try {
    const { nome, email, telefone, whatsapp, observacoes } = req.body || {};

    if (!nome || !email) {
      return res.status(400).json({ ok: false, error: "Nome e e-mail são obrigatórios" });
    }

    // 1. Gerar token único
    const token = crypto.randomBytes(16).toString("hex");

    // 2. Inserir no banco como "pendente"
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO alunos (nome, email, telefone, status, criado_em)
         VALUES ($1,$2,$3,'pendente',NOW())
         ON CONFLICT (email) DO UPDATE
         SET nome=EXCLUDED.nome, telefone=EXCLUDED.telefone, status='pendente'
         RETURNING id`,
        [nome, email, telefone]
      );
    } finally {
      client.release();
    }

    // 3. Montar link de convite
    const link = `https://www.planckkokoro.com/cadastro/continuar.html?token=${token}`;

    return res.status(200).json({ ok: true, link });
  } catch (err) {
    console.error("Erro invite:", err);
    return res.status(500).json({ ok: false, error: "Falha no servidor" });
  }
}
