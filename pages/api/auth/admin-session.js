import { exigirAdmin } from '../_lib/kokoro-auth.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({
      ok: false,
      error: 'Método não permitido'
    });
  }

  const sessao = exigirAdmin(req, res);

  if (!sessao) return;

  return res.status(200).json({
    ok: true,
    role: 'admin'
  });
}
