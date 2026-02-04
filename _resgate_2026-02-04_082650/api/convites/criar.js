import { sql } from '../_lib/db.js';

// CORS p/ testes locais (WebStorm/localhost)
function withCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

// normaliza telefone para DDI+DDD+numero (ex: 5532984945886)
function normPhoneBR(v) {
  if (!v) return '';
  let s = String(v).replace(/\D/g, '');
  s = s.replace(/^0+/, '');
  if (!s.startsWith('55')) s = '55' + s;
  return s;
}

// dispara template boas_vindas via nosso endpoint /api/notify/send-template
async function safeSendWelcome(telefone, nome) {
  try {
    const to = normPhoneBR(telefone);
    if (!to) return { skipped:true, reason:'no phone' };

    const r = await fetch('https://www.planckkokoro.com/api/notify/send-template', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        to,
        template: 'boas_vindas',
        lang: 'pt_BR',
        variables: [ String(nome || '') ]
      })
    });
    const j = await r.json().catch(() => ({}));
    return { ok: !!(r.ok && j.ok), response: j };
  } catch (e) {
    return { ok:false, error:String(e) };
  }
}

export default async function handler(req, res) {
  if (withCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const nome = (body?.nome ?? '').toString().trim() || null;
    const emailRaw = (body?.email ?? '').toString().trim();
    const telefone = (body?.telefone ?? '').toString().trim() || null;

    if (!emailRaw) return res.status(400).json({ ok:false, error:'Informe o e-mail' });
    const email = emailRaw.toLowerCase();

    const token =
      Math.random().toString(36).slice(2,10) +
      Math.random().toString(36).slice(2,10);

    const id =
      'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);

    // Importante: tabela "convites" deve existir (ideal: via migration/script)
    await sql`
      INSERT INTO convites (id, token, email, nome, telefone)
      VALUES (${id}, ${token}, ${email}, ${nome}, ${telefone})
    `;

    const url = `https://www.planckkokoro.com/cadastro/index.html?token=${encodeURIComponent(token)}`;

    // tentativa de envio do WhatsApp (não bloqueia o sucesso do convite)
    const notify = await safeSendWelcome(telefone, nome);

    return res.status(200).json({ ok:true, token, url, notify });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  }
}
