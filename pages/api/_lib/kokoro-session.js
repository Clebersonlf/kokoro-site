import crypto from 'node:crypto';

const COOKIE_NAME = 'kokoro_session';

function getSessionSecret() {
  const secret = process.env.KOKORO_SESSION_SECRET;
  if (!secret || secret.length < 48) {
    throw new Error('KOKORO_SESSION_SECRET não configurada');
  }
  return secret;
}

function sign(value) {
  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(value)
    .digest('base64url');
}

export function criarTokenSessao(role, subject, segundos = 3600) {
  const payload = {
    role,
    sub: String(subject),
    exp: Math.floor(Date.now() / 1000) + segundos
  };

  const dados = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return dados + '.' + sign(dados);
}

export function verificarTokenSessao(token) {
  try {
    if (typeof token !== 'string') return null;

    const partes = token.split('.');
    if (partes.length !== 2) return null;

    const [dados, assinatura] = partes;
    const esperado = Buffer.from(sign(dados));
    const recebido = Buffer.from(assinatura);

    if (
      esperado.length !== recebido.length ||
      !crypto.timingSafeEqual(esperado, recebido)
    ) return null;

    const payload = JSON.parse(
      Buffer.from(dados, 'base64url').toString('utf8')
    );

    if (
      !payload ||
      !['admin', 'aluno', 'professor'].includes(payload.role) ||
      typeof payload.sub !== 'string' ||
      !payload.sub ||
      !Number.isSafeInteger(payload.exp) ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) return null;

    return payload;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
