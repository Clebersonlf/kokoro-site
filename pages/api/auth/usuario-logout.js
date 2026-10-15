export default function handler(req, res) {
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

  const seguro = process.env.NODE_ENV === 'production';

  res.setHeader(
    'Set-Cookie',
    'kokoro_session=; Path=/; HttpOnly; SameSite=Strict; ' +
    'Max-Age=0' + (seguro ? '; Secure' : '')
  );

  return res.status(204).end();
}
