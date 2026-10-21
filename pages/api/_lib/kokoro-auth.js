import {
  COOKIE_NAME,
  verificarTokenSessao
} from './kokoro-session.js';

export function obterSessao(req) {
  const cookies = req.cookies || {};
  const token = cookies[COOKIE_NAME];

  if (!token || typeof token !== 'string') {
    return null;
  }

  return verificarTokenSessao(token);
}

export function exigirAdmin(req, res) {
  const sessao = obterSessao(req);

  if (!sessao) {
    res.status(401).json({
      ok: false,
      error: 'Autenticação necessária'
    });
    return null;
  }

  if (sessao.role !== 'admin') {
    res.status(403).json({
      ok: false,
      error: 'Acesso não autorizado'
    });
    return null;
  }

  return sessao;
}
