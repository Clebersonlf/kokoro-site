import { createClient } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!url) return res.status(500).json({ ok:false, error:'NO_DB_URL' });

    const client = createClient({ connectionString: url });
    await client.connect();

    const { rows } = await client.sql`
      SELECT
        id,
        nome,
        email,
        telefone,
        COALESCE(cad_numero, numero_vitalicio) AS cad_numero,
        criado_em AS created_at
      FROM alunos
      ORDER BY criado_em DESC
      LIMIT 200;
    `;

    await client.end();
    return res.status(200).json({ ok:true, rows });
  } catch (e) {
    return res.status(500).json({ ok:false, error: String(e) });
  }
}
