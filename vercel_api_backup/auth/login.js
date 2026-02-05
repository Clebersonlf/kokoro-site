// /api/auth/login.js
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const connectionString =
    process.env.DATABASE_URL || process.env.POSTGRES_URL;

let pool;
export default async function handler(req, res) {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({ ok: false, error: "Method not allowed" });
        }

        if (!connectionString) {
            return res.status(500).json({ ok: false, error: "DATABASE_URL/POSTGRES_URL ausente" });
        }

        // inicializa pool 1x por execução
        if (!pool) {
            pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
        }

        const { email, senha } = req.body || {};
        if (!email || !senha) {
            return res.status(400).json({ ok: false, error: "Email e senha são obrigatórios" });
        }

        // busca usuário por email
        const { rows } = await pool.query(
            "SELECT id, nome, email, senha_hash, role FROM public.usuarios WHERE email = $1 LIMIT 1",
            [email]
        );

        if (!rows.length) {
            return res.status(401).json({ ok: false, error: "Credenciais inválidas" });
        }

        const user = rows[0];

        // compara senha
        const ok = await bcrypt.compare(senha, user.senha_hash);
        if (!ok) {
            return res.status(401).json({ ok: false, error: "Credenciais inválidas" });
        }

        // opcional: gerar um token/sessão; por enquanto só confirma
        return res.status(200).json({
            ok: true,
            user: { id: user.id, nome: user.nome, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({ ok: false, error: "Erro interno no login" });
    }
}
