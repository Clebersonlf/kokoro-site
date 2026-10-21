import { COOKIE_NAME } from '../_lib/kokoro-session.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      error: 'Método não permitido'
    });
  }

  let origemValida = false;

  try {
    const origem = new URL(req.headers.origin);
    origemValida =
      origem.host === req.headers.host &&
      ['http:', 'https:'].includes(origem.protocol);
  } catch {
    origemValida = false;
  }

  if (!origemValida) {
    return res.status(403).json({
      ok: false,
      error: 'Origem não autorizada'
    });
  }

  const secure = process.env.NODE_ENV === 'production'
    ? '; Secure'
    : '';

  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`
  );

  return res.status(204).end();
}
