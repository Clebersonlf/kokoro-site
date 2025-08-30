import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ ok: false, message: "Use POST" });
    }

    // Lê body JSON
    const body = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (c) => (data += c));
      req.on("end", () => {
        try { resolve(JSON.parse(data || "{}")); }
        catch (e) { reject(e); }
      });
      req.on("error", reject);
    });

    const { email, senha } = body;
    if (!email || !senha) {
      return res.status(400).json({ ok: false, message: "Informe email e senha" });
    }

    // Conexão Neon/Postgres
    const sql = neon(process.env.DATABASE_URL);

    // Busca usuário
    const rows = await sql`select id,nome,email,role,password_hash,senha_hash from usuarios where lower(email)=lower(${email}) limit 1`;
    if (rows.length === 0) {
      return res.status(401).json({ ok: false, message: "Credenciais inválidas" });
    }

    const user = rows[0];
    const hash = user.password_hash || user.senha_hash;
    const ok = await bcrypt.compare(senha, hash);
    if (!ok) {
      return res.status(401).json({ ok: false, message: "Credenciais inválidas" });
    }

    // Resposta
    return res.status(200).json({
      ok: true,
      user: { id: user.id, nome: user.nome, email: user.email, role: user.role }
    });

  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
}
