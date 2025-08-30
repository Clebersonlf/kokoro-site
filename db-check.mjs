// db-check.mjs
import { neon } from "@neondatabase/serverless";

// Usa a variável de ambiente que você configurou no Vercel
const sql = neon(process.env.DATABASE_URL);

async function checkDB() {
    try {
        const result = await sql`SELECT NOW()`;
        console.log("✅ Conexão bem-sucedida! Hora do servidor:", result[0].now);
    } catch (err) {
        console.error("❌ Erro ao conectar no banco:", err);
    }
}

checkDB();