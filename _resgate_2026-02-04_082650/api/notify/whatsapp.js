/**
 * /api/notify/whatsapp
 * Body: { to: "+55DDDNUMERO", text: "mensagem" }
 * Requer vars: WHATSAPP_API_TOKEN, WHATSAPP_PHONE_ID
 */

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
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    let { to, text } = body;
    const TOKEN   = process.env.WHATSAPP_API_TOKEN;
    const PHONEID = process.env.WHATSAPP_PHONE_ID;

    if (!TOKEN || !PHONEID) {
      return res.status(500).json({ ok:false, error:'Ambiente sem WHATSAPP_API_TOKEN/WHATSAPP_PHONE_ID' });
    }

    if (!to)   return res.status(400).json({ ok:false, error:'Informe "to" em formato E.164 (ex: +5531999998888)' });
    if (!text) text = 'Olá! (mensagem padrão)';

    // Chamada ao Graph API
    const url = `https://graph.facebook.com/v20.0/${PHONEID}/messages`;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { preview_url: true, body: text }
      })
    });

    const json = await r.json().catch(()=> ({}));
    if (!r.ok) {
      return res.status(r.status).json({ ok:false, error:'Graph error', details: json });
    }

    return res.status(200).json({ ok:true, result: json });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  }
}
