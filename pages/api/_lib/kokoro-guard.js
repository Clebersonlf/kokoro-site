import { exigirAdmin } from './kokoro-auth.js';

export function exigirAdminMutacao(req, res) {
  const sessao = exigirAdmin(req, res);
  if (!sessao) return null;

  let origemValida = false;

  try {
    const permitido = new URL(
      process.env.KOKORO_APP_ORIGIN
    ).origin;

    origemValida =
      req.headers?.origin === permitido;
  } catch {
    origemValida = false;
  }

  if (!origemValida) {
    res.status(403).json({
      ok: false,
      error: 'Origem não autorizada'
    });
    return null;
  }

  return sessao;
}
