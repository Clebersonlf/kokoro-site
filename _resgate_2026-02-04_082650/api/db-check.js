import { Pool } from "pg";

// cria conexão com banco
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // usa a variável que já está no Vercel
    ssl: {
        rejectUnauthorized: false,
    },
});

export default async function handler(req, res) {
    try {
        const result = await pool.query("SELECT NOW()");
        res.status(200).json({ ok: true, time: result.rows[0].now });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
}
