import crypto from 'node:crypto';
import { exigirAdminMutacao } from '../_lib/kokoro-guard.js';
import { sql } from '../_lib/db.js';

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
  const sessao = exigirAdminMutacao(req, res);
  if (!sessao) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const nome = (body?.nome ?? '').toString().trim() || null;
    const emailRaw = (body?.email ?? '').toString().trim();
    const telefone = (body?.telefone ?? '').toString().trim() || null;

    if (!emailRaw) return res.status(400).json({ ok:false, error:'Informe o e-mail' });
    const email = emailRaw.toLowerCase();

    const token = crypto.randomBytes(12).toString('base64url');

    const id =
      'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);

    // Importante: tabela "convites" deve existir (ideal: via migration/script)
    await sql`
      INSERT INTO convites (id, token, email, nome, telefone, expira_em)
VALUES (${id}, ${token}, ${email}, ${nome}, ${telefone}, now() + interval '72 hours')
    `;

    const url = `https://www.planckkokoro.com/cadastro/index.html?token=${encodeURIComponent(token)}`;

    // tentativa de envio do WhatsApp (não bloqueia o sucesso do convite)
    const notify = await safeSendWelcome(telefone, nome);

    return res.status(200).json({ ok:true, token, url, notify });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  }
}
