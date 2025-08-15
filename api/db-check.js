// api/db-check.js  (CommonJS – compatível no Vercel)
const { neon } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
    try {
        const sql = neon(process.env.DATABASE_URL);

        // Teste simples: pega infos do banco
        const rows = await sql`
      SELECT NOW()        AS agora,
             current_user AS usuario,
             current_database() AS banco
    `;
        res.status(200).json({ ok: true, ...rows[0] });
    } catch (err) {
        res.status(500).json({ ok: false, error: String(err) });
    }
};