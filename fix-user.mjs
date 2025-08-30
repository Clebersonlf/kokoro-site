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

const say = (...a) => console.log(...a);

const url = pickUrl();
if (!url) {
  say("FALHA: nenhuma URL de banco encontrada no .env");
  process.exit(2);
}

const sql = neon(url);

const EMAIL = (process.argv.find(a=>a.startsWith("--email="))||"").split("=").slice(1).join("=") || process.env.TEST_EMAIL;
const PASS  = (process.argv.find(a=>a.startsWith("--pass=")) ||"").split("=").slice(1).join("=") || process.env.TEST_PASS;

(async () => {
  try {
    say("🔗 Host:", new URL(url).host);
    const meta = await sql`select current_database() db, current_user usr`;
    say("✅ Conectado:", meta[0].db, "como", meta[0].usr);

    // Confere se a tabela existe
    const t = await sql`
      select 1 from information_schema.tables
      where table_schema='public' and table_name='usuarios'
      limit 1
    `;
    if (t.length===0) {
      say("FALHA: tabela public.usuarios não existe.");
      process.exit(3);
    }

    // Procura o usuário (trim + lower pra evitar espaços/letras)
    const rows = await sql`
      select id, email, senha_hash, role
      from public.usuarios
      where trim(lower(email)) = trim(lower(${EMAIL}))
      limit 1
    `;

    if (rows.length===0) {
      say("❌ Usuário NÃO encontrado:", EMAIL);
      const lista = await sql`select email from public.usuarios order by 1 limit 20`;
      say("📋 Emails existentes (até 20):", lista.map(x=>x.email));
      process.exit(4);
    }

    const u = rows[0];
    say("👤 Encontrado:", u.email, "role:", u.role, "hash prefixo:", (u.senha_hash||"").slice(0,7));

    // Se a senha não estiver em bcrypt ($2...), atualiza
    const precisaHash = !(u.senha_hash||"").startsWith("$2");
    const novoHash = await bcrypt.hash(PASS, 12);
    if (precisaHash || !(await bcrypt.compare(PASS, u.senha_hash||""))) {
      await sql`update public.usuarios set senha_hash=${novoHash} where id=${u.id}`;
      say("🔧 senha_hash atualizada no banco.");
    }

    // Valida após atualizar
    const check = await sql`
      select senha_hash from public.usuarios where id=${u.id} limit 1
    `;
    const ok = await bcrypt.compare(PASS, check[0].senha_hash);
    if (ok) {
      say("✅ SENHA OK — login deverá funcionar.");
      process.exit(0);
    } else {
      say("❌ Senha ainda NÃO confere após atualização.");
      process.exit(5);
    }
  } catch (e) {
    say("ERRO:", e?.message || String(e));
    process.exit(1);
  }
})();
