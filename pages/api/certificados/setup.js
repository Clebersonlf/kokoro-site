import { sql } from '../_lib/db.js';

export default async function handler(req, res) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS certificados (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        numero_certificado TEXT UNIQUE NOT NULL,
        titular TEXT NOT NULL,
        graduacao TEXT NOT NULL,
        data_emissao DATE NOT NULL,
        instituicao TEXT DEFAULT 'Luiz Guinder Team',
        status TEXT DEFAULT 'valido',
        observacoes TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    return res.status(200).json({ ok: true, message: 'Tabela certificados pronta' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
