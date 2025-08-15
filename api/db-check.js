// api/db-check.js (ESM)
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    try {
        // tenta várias chaves possíveis
        const url =
            process.env.NEON_DATABASE_URL ||
            process.env.DATABASE_URL ||
            process.env.POSTGRES_URL ||
            process.env.POSTGRES_PRISMA_URL ||
            process.env.POSTGRES_URL_NON_POOLING;

        if (!url) {
            return res
                .status(500)
                .json({
                    ok: false,
                    error:
                        'Nenhuma variável de conexão encontrada (NEON_DATABASE_URL/DATABASE_URL/POSTGRES_*)',
                });
        }

        const sql = neon(url);
        const rows = await sql`
      SELECT NOW() AS agora,
             current_user AS usuario,
             current_database() AS banco
    `;

        return res.status(200).json({ ok: true, ...rows[0] });
    } catch (err) {
        return res.status(500).json({ ok: false, error: String(err) });
    }
}