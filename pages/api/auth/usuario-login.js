import bcrypt from 'bcryptjs';
import { sql } from '../_lib/db.js';
import { criarTokenSessao } from '../_lib/kokoro-session.js';

const HASH_FAKE = bcrypt.hashSync('conta-inexistente', 10);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false, error: 'Metodo nao permitido'
    });
  }

  let origem;
  try {
    origem = new URL(process.env.KOKORO_APP_ORIGIN).origin;
  } catch {
    return res.status(503).json({
      ok: false, error: 'Configuracao indisponivel'
    });
  }

  if (req.headers.origin !== origem) {
    return res.status(403).json({
      ok: false, error: 'Origem nao autorizada'
    });
  }

  const email = typeof req.body?.email === 'string'
    ? req.body.email.trim().toLowerCase()
    : '';

  const senha = req.body?.senha;

  if (
    !email ||
    email.length > 254 ||
    !email.includes('@') ||
    typeof senha !== 'string' ||
    !senha ||
    senha.length > 1024
  ) {
    return res.status(400).json({
      ok: false, error: 'Dados de acesso invalidos'
    });
  }

  try {
    const contas = await sql`
      SELECT id, senha_hash, perfil, ativo,
             aluno_id, tentativas_falhas, bloqueado_ate
      FROM contas_acesso
      WHERE LOWER(BTRIM(email)) = ${email}
      LIMIT 1
    `;

    const conta = contas[0] || null;

    const confere = await bcrypt.compare(
      senha, conta?.senha_hash || HASH_FAKE
    );

    const bloqueada = conta?.bloqueado_ate &&
      new Date(conta.bloqueado_ate).getTime() > Date.now();

    if (!conta || !conta.ativo || !confere || bloqueada) {
      if (conta?.ativo && !confere && !bloqueada) {
        await sql`
          UPDATE contas_acesso
          SET tentativas_falhas = tentativas_falhas + 1,
              bloqueado_ate = CASE
                WHEN tentativas_falhas + 1 >= 5
                THEN NOW() + INTERVAL '15 minutes'
                ELSE NULL
              END
          WHERE id = ${conta.id}
        `;
      }

      return res.status(401).json({
        ok: false, error: 'Credenciais invalidas'
      });
    }

    if (
      !['aluno', 'professor'].includes(conta.perfil) ||
      (conta.perfil === 'aluno' && !conta.aluno_id)
    ) {
      return res.status(403).json({
        ok: false, error: 'Conta indisponivel'
      });
    }

    await sql`
      UPDATE contas_acesso
      SET tentativas_falhas = 0,
          bloqueado_ate = NULL
      WHERE id = ${conta.id}
    `;

    const token = criarTokenSessao(
      conta.perfil, conta.id, 1800
    );

    const seguro = process.env.NODE_ENV === 'production';

    res.setHeader(
      'Set-Cookie',
      `kokoro_session=${token}; Path=/; HttpOnly; ` +
      `SameSite=Strict; Max-Age=1800` +
      (seguro ? '; Secure' : '')
    );

    return res.status(200).json({
      ok: true,
      perfil: conta.perfil
    });

  } catch (erro) {
    console.error('[usuario-login] Falha interna');
    return res.status(503).json({
      ok: false, error: 'Login temporariamente indisponivel'
    });
  }
}
