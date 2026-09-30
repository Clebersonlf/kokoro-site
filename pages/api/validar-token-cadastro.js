import { Client } from 'pg';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      ok:false,
      valid:false,
      reason:'method_not_allowed'
    });
  }

  try {
    const token = String(req.query.token || '').trim();

    if (!token) {
      return res.status(400).json({
        ok:false,
        valid:false,
        reason:'token_obrigatorio'
      });
    }

    const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;

    if (!url) {
      return res.status(500).json({
        ok:false,
        valid:false,
        reason:'db_nao_configurado'
      });
    }

    const client = new Client({
      connectionString: url,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    const r = await client.query(
      `
      SELECT
        id,
        nome,
        email,
        telefone,
        status,
        token_cadastro,
        token_cadastro_expira_em,
        token_cadastro_usado_em
      FROM alunos
      WHERE token_cadastro = $1
      LIMIT 1
      `,
      [token]
    );

    await client.end();

    if (!r.rows.length) {
      return res.status(404).json({
        ok:false,
        valid:false,
        reason:'nao_encontrado'
      });
    }

    const aluno = r.rows[0];

    if (aluno.token_cadastro_usado_em) {
      return res.status(200).json({
        ok:true,
        valid:false,
        reason:'ja_usado',
        aluno
      });
    }

    if (
      aluno.token_cadastro_expira_em &&
      new Date(aluno.token_cadastro_expira_em).getTime() < Date.now()
    ) {
      return res.status(200).json({
        ok:true,
        valid:false,
        reason:'expirado',
        aluno
      });
    }

    return res.status(200).json({
      ok:true,
      valid:true,
      reason:'ok',
      aluno
    });

  } catch (e) {
    return res.status(500).json({
      ok:false,
      valid:false,
      reason:'erro_servidor',
      error:String(e)
    });
  }
}
