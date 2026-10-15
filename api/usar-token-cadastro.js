import { Client } from 'pg';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string'
      ? JSON.parse(req.body || '{}')
      : (req.body || {});

    const token = String(body.token || '').trim();

    if (!token) {
      return res.status(400).json({
        ok:false,
        error:'TOKEN_OBRIGATORIO'
      });
    }

    const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;

    if (!url) {
      return res.status(500).json({
        ok:false,
        error:'POSTGRES_URL_NAO_CONFIGURADO'
      });
    }

    const client = new Client({
      connectionString: url,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    const r = await client.query(
      `
      UPDATE alunos
      SET token_cadastro_usado_em = NOW()
      WHERE token_cadastro = $1
        AND token_cadastro_usado_em IS NULL
        AND (
          token_cadastro_expira_em IS NULL
          OR token_cadastro_expira_em > NOW()
        )
      RETURNING id, nome, email, token_cadastro_usado_em
      `,
      [token]
    );

    await client.end();

    if (!r.rows.length) {
      return res.status(400).json({
        ok:false,
        error:'TOKEN_INVALIDO_USADO_OU_EXPIRADO'
      });
    }

    return res.status(200).json({
      ok:true,
      aluno:r.rows[0]
    });

  } catch (e) {
    return res.status(500).json({
      ok:false,
      error:String(e)
    });
  }
}
