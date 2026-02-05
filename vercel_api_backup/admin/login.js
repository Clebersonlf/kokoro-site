export default async function handler(req, res) {
  // CORS / preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    return res.status(204).end();
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '').trim();

    const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || 'planckkokoro@gmail.com').toLowerCase();
    const ADMIN_PASS  = String(process.env.ADMIN_PASS  || 'Semprekokoro@#$');

    // LOG seguro (mostra tamanho da senha, não a senha)
    console.log('[LOGIN]',
      { ts: new Date().toISOString(),
        host: req.headers.host,
        ua: req.headers['user-agent'],
        email, emailOK: email === ADMIN_EMAIL,
        passLen: password.length,
        passOK: password === ADMIN_PASS });

    res.setHeader('Access-Control-Allow-Origin', '*');

    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      return res.status(200).json({ ok:true, token:'admin-token', user:{ role:'admin', email } });
    }
    return res.status(401).json({
      ok:false, message:'Credenciais inválidas',
      info:{ emailOK: email === ADMIN_EMAIL, passOK: password === ADMIN_PASS, passLen: password.length }
    });
  } catch (e) {
    console.error('[LOGIN_ERROR]', String(e));
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ ok:false, message:'Erro no login', error:String(e) });
  }
}
