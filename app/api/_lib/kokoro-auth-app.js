import { verificarTokenSessao } from '../../../pages/api/_lib/kokoro-session.js';

function respostaErro(status, mensagem) {
  return Response.json(
    { ok: false, error: mensagem },
    {
      status,
      headers: { 'Cache-Control': 'no-store' }
    }
  );
}

export function exigirAdminApp(request, { mutacao = false } = {}) {
  const cookies = request.headers.get('cookie') || '';

  const entrada = cookies
    .split(';')
    .map(item => item.trim())
    .find(item => item.startsWith('kokoro_session='));

  const token = entrada
    ? entrada.slice('kokoro_session='.length)
    : null;

  const sessao = verificarTokenSessao(token);

  if (!sessao) {
    return respostaErro(401, 'Autenticacao obrigatoria');
  }

  if (sessao.role !== 'admin') {
    return respostaErro(403, 'Acesso nao autorizado');
  }

  if (mutacao) {
    let origemEsperada;

    try {
      origemEsperada = new URL(process.env.KOKORO_APP_ORIGIN).origin;
    } catch {
      return respostaErro(503, 'Origem do sistema nao configurada');
    }

    if (request.headers.get('origin') !== origemEsperada) {
      return respostaErro(403, 'Origem nao autorizada');
    }
  }

  return null;
}
