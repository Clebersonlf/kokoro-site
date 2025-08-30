// verifica-login.mjs
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

// Ler argumentos do terminal
const args = process.argv.slice(2);
const emailArg = args.find(arg => arg.startsWith("--email="));
const email = emailArg ? emailArg.split("=")[1] : null;

if (!email) {
    console.error("❌ Você precisa passar um email. Exemplo:");
    console.error("   node verifica-login.mjs --email=planckkokoro@gmail.com");
    process.exit(1);
}

// Conectar ao banco
const sql = neon(process.env.DATABASE_URL);

try {
    const result = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (result.length > 0) {
        console.log("✅ Usuário encontrado:", result[0]);
    } else {
        console.log("⚠️ Nenhum usuário encontrado com esse email.");
    }
} catch (err) {
    console.error("❌ Erro ao consultar o banco:", err.message);
}