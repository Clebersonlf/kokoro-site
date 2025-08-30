import "dotenv/config";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

function pickUrl() {
  return process.env.DATABASE_URL_2
      || process.env.NEON_DATABASE_URL
      || process.env.DATABASE_URL
      || process.env.POSTGRES_URL
      || process.env.POSTGRES_URL_NON_POOLING
      || process.env.POSTGRES_PRISMA_URL
      || "";
}

const url = pickUrl();
const say = (...a) => console.log(...a);

if (!url) {
  say("FALHA: nenhuma variável de conexão encontrada (use DATABASE_URL_2, DATABASE_URL, NEON_DATABASE_URL, POSTGRES_*).");
  process.exit(2);
}

try {
  const host = new URL(url).host;
  say("✅ URL detectada:", host);

  const sql = neon(url);
  const meta = await sql`select current_database() as db, current_user as usr`;
  say("✅ Conectado ao banco:", meta[0].db, "como", meta[0].usr);

  const email = (process.argv.find(a=>a.startsWith("--email="))||"").split("=").slice(1).join("=") || process.env.TEST_EMAIL;
  const pass  = (process.argv.find(a=>a.startsWith("--pass=")) ||"").split("=").slice(1).join("=") || process.env.TEST_PASS;

  if (!email || !pass) {
    say("FALHA: informe --email e --pass.");
    process.exit(2);
  }

  // <-- AQUI: nome da tabela direto, sem interpolação de identificador
  const rows = await sql`
    select id, email, senha_hash, role
    from public.usuarios
    where lower(email)=lower(${email})
    limit 1
  `;

  if (rows.length === 0) {
    say("FALHA: usuário não encontrado:", email);
    process.exit(3);
  }

  const u = rows[0];
  say("ℹ️  Hash (prefixo 7):", (u.senha_hash || "").slice(0,7));
  const ok = await bcrypt.compare(pass, u.senha_hash || "");
  if (!ok) {
    say("FALHA: senha não confere para esse usuário.");
    process.exit(4);
  }

  say("✅ SENHA OK — usuário encontrado. ROLE =", u.role);
  process.exit(0);
} catch (e) {
  say("ERRO AO CONECTAR/CONSULTAR:", String(e));
  process.exit(1);
}
