export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok:false, message:'Method not allowed' });
  }

  try {
    const { email, password } = (req.body || {});
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'planckkokoro@gmail.com';
    const ADMIN_PASS  = process.env.ADMIN_PASS  || 'Semprekokoro@#$';

    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      // você pode trocar por um JWT depois; por ora token simples
      return res.status(200).json({ ok:true, token:'admin-token', user:{role:'admin', email} });
    }
    return res.status(401).json({ ok:false, message:'Credenciais inválidas' });
  } catch (e) {
    return res.status(500).json({ ok:false, message:'Erro no login', error: String(e) });
  }
}
