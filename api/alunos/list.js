import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) return res.status(500).json({ ok:false, message:"DATABASE_URL ausente" });

    const sql = neon(url);

    const rows = await sql`select id, nome, email, cad_numero, created_at from alunos order by created_at desc`;

    return res.status(200).json({ ok:true, rows });
  } catch (e) {
    return res.status(500).json({ ok:false, message: e.message });
  }
}
