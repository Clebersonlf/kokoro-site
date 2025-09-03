import { createClient } from '@vercel/postgres';
import { Resend } from 'resend';

function ok(res, data){ return res.status(200).json({ ok:true, ...data }); }
function bad(res, code, msg){ return res.status(code).json({ ok:false, error:msg }); }

export default async function handler(req, res){
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return bad(res, 405, 'Method not allowed');
  }

  const { token, email: emailIn, nome: nomeIn } = (typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{}));
  const POOL = process.env.POSTGRES_URL;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) return bad(res, 500, 'RESEND_API_KEY não definido (configure em Vercel)');
  const resend = new Resend(RESEND_API_KEY);

  // Descobre email/nome/link a partir do token OU usa os dados passados
  let email = (emailIn||'').trim();
  let nome  = (nomeIn||'').trim();
  let link  = '';

  if (token) {
    if (!POOL) return bad(res, 500, 'POSTGRES_URL não definido');
    const client = createClient({ connectionString: POOL });
    await client.connect();
    try{
      const { rows } = await client.sql`SELECT email, nome, token FROM convites WHERE token=${token} AND status IS DISTINCT FROM 'cancelado' LIMIT 1;`;
      if (!rows?.length) return bad(res, 404, 'Convite não encontrado ou cancelado');
      email = email || rows[0].email;
      nome  = nome  || rows[0].nome || 'Aluno(a)';
      link  = `https://www.planckkokoro.com/cadastro/index.html?token=${encodeURIComponent(rows[0].token)}`;
    } finally {
      await client.end();
    }
  } else {
    if (!email) return bad(res, 400, 'Informe token OU email');
    // Se vier sem token, monta um link genérico explicativo
    link = 'https://www.planckkokoro.com/cadastro/index.html';
  }

  const subject = 'Seu convite para completar o cadastro';
  const html = `
    <div style="font-family:system-ui,Arial">
      <p>Olá ${nome||'Aluno(a)'}!</p>
      <p>Segue o link para completar seu cadastro:</p>
      <p><a href="${link}" target="_blank">${link}</a></p>
      <p>Se você não solicitou, ignore este e-mail.</p>
      <p>Atenciosamente,<br/>Planck Kokoro</p>
    </div>
  `;
  const text = `Olá ${nome||'Aluno(a)'}!\n\nSegue o link para completar seu cadastro:\n${link}\n\nSe você não solicitou, ignore este e-mail.\n\nPlanck Kokoro`;

  try{
    const sendResult = await resend.emails.send({
      from: 'Planck Kokoro <convite@planckkokoro.com>',
      to: [email],
      subject,
      html,
      text
    });
    return ok(res, { provider: 'resend', id: sendResult?.id || null, to: email, link });
  }catch(e){
    return bad(res, 500, String(e));
  }
}
