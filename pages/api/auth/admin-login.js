import bcrypt from 'bcryptjs';
import { criarTokenSessao } from '../_lib/kokoro-session.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      error: 'Método não permitido'
    });
  }

  const origem = req.headers.origin;
  const host = req.headers.host;

  if (!origem || !host) {
    return res.status(403).json({
      ok: false,
      error: 'Origem não autorizada'
    });
  }

  let url;
  try {
    url = new URL(origem);
  } catch {
    return res.status(403).json({
      ok: false,
      error: 'Origem inválida'
    });
  }

  if (url.host !== host ||
      !['http:', 'https:'].includes(url.protocol)) {
    return res.status(403).json({
      ok: false,
      error: 'Origem não autorizada'
    });
  }

  const hash = process.env.KOKORO_ADMIN_PASSWORD_HASH;
  const informado = req.body?.secret;

  if (!hash) {
    return res.status(503).json({
      ok: false, error: 'Autenticação não configurada'
    });
  }

  if (typeof informado !== 'string' || informado.length > 1024) {
    return res.status(401).json({
      ok: false, error: 'Credenciais inválidas'
    });
  }

  const valido = await bcrypt.compare(informado, hash);

  if (!valido) {
    return res.status(401).json({
      ok: false, error: 'Credenciais inválidas'
    });
  }

  const seguro = process.env.NODE_ENV === 'production';
  const token = criarTokenSessao('admin', 'admin-bootstrap', 1800);

  res.setHeader('Set-Cookie', [
    `kokoro_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=1800${seguro ? '; Secure' : ''}`
  ]);

  return res.status(200).json({ ok: true });
}
