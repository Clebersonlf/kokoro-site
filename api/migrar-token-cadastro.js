import { Client } from 'pg';

export default async function handler(req, res) {
  try {
    const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!url) return res.status(500).json({ ok:false, error:'POSTGRES_URL não configurado' });

    const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    await client.connect();

    await client.query(`
      ALTER TABLE alunos
      ADD COLUMN IF NOT EXISTS token_cadastro_expira_em TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS token_cadastro_usado_em TIMESTAMPTZ
    `);

    await client.end();

    return res.status(200).json({ ok:true, msg:'colunas de token de cadastro criadas em alunos' });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  }
}
