// verifica-login.mjs
import dotenv from "dotenv";
dotenv.config();

const USER = process.env.DB_USER;
const PASS = process.env.DB_PASS;

if (USER && PASS) {
    console.log("✅ Variáveis carregadas com sucesso:");
    console.log("Usuário:", USER);
    console.log("Senha:", PASS);
} else {
    console.error("❌ Erro: variáveis não encontradas. Verifique seu .env");
}