import { Resend } from 'resend';

// CORS simples p/ testes locais
function withCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

export default async function handler(req, res) {
  if (withCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return res.status(500).json({ ok:false, error:'RESEND_API_KEY não definida' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const to = body.to;
    const subject = body.subject || 'Teste Resend';
    const html = body.body
      ? `<div>${body.body}</div>`
      : `<div>Se você recebeu este e-mail, a integração do Kokoro com Resend está funcionando.</div>`;

    if (!to) return res.status(400).json({ ok:false, error:'Informe "to" (destinatário)' });

    const resend = new Resend(apiKey);

    // IMPORTANTE:
    // - Em modo grátis, o From pode ser onboarding@resend.dev
    // - O "to" precisa estar verificado no painel do Resend (Verified Emails)
    const { data, error } = await resend.emails.send({
      from: 'Kokoro <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    if (error) return res.status(500).json({ ok:false, error: String(error) });

    return res.status(200).json({ ok:true, id: data?.id || null });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  }
}
