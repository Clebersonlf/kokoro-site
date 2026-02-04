/**
 * POST /api/notify/send-template
 * Body:
 *   {
 *     "to": "5532984945886",        // destino SEM +, DDI+DDD+numero
 *     "template": "boas_vindas",     // nome do template aprovado
 *     "lang": "pt_BR",               // idioma do template
 *     "variables": ["Cleberson"]     // array p/ preencher {{1}}, {{2}}, ...
 *   }
 * Requer envs: WHATSAPP_API_TOKEN, WHATSAPP_PHONE_ID
 */

function withCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

function normPhoneBR(v) {
  if (!v) return '';
  let s = String(v).replace(/\D/g, '');
  // remove zeros à esquerda
  s = s.replace(/^0+/, '');
  // se não tem DDI, prefixa 55
  if (!s.startsWith('55')) s = '55' + s;
  return s;
}

export default async function handler(req, res) {
  if (withCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    let { to, template='boas_vindas', lang='pt_BR', variables=[] } = body;

    const TOKEN   = process.env.WHATSAPP_API_TOKEN;
    const PHONE_ID= process.env.WHATSAPP_PHONE_ID;

    if (!TOKEN || !PHONE_ID) {
      return res.status(500).json({ ok:false, error:'Ambiente sem WHATSAPP_API_TOKEN/WHATSAPP_PHONE_ID' });
    }

    to = normPhoneBR(to);
    if (!to || to.length < 12) {
      return res.status(400).json({ ok:false, error:'Informe o destino em DDI+DDD+numero (ex: 5532984945886)' });
    }

    // monta components do template a partir das variáveis
    const components = [];
    if (Array.isArray(variables) && variables.length) {
      components.push({
        type: 'body',
        parameters: variables.map(v => ({ type:'text', text: String(v ?? '') }))
      });
    }

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: template,
        language: { code: lang },
        ...(components.length ? { components } : {})
      }
    };

    const url = `https://graph.facebook.com/v23.0/${PHONE_ID}/messages`;
    const r = await fetch(url, {
      method:'POST',
      headers:{
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const j = await r.json().catch(()=> ({}));
    if (!r.ok) {
      return res.status(500).json({ ok:false, error:'Graph error', details:j });
    }
    return res.status(200).json({ ok:true, to, template, lang, graph:j });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  }
}
