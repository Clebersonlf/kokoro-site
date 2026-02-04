import { getClient } from '../../lib/db.js';
function fmtDoc(s){
  const raw = String(s||'').replace(/\D/g,'');
  if (raw.length === 11) { // CPF
    return raw.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return s || '—';
}


function labelTitle(p, extra){
  const e = extra || {};
  const rawFaixa = String(e.faixa || (p && p.faixa) || '').toLowerCase();
  const tipoRaw  = String(e.tipo  || (p && p.tipo)  || '').toLowerCase();
  const titular  = !!(e.eh_titular || e.is_titular || (p && (p.eh_titular || p.is_titular)));

  const deAcento = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const f = deAcento(rawFaixa);

  // 0) Titular tem prioridade
  if (titular) return 'Prof. Titular';

  // 1) Mapa por FAIXA
  // Azul / Roxa -> Mon.
  if (/azul/.test(f) || /roxa?/.test(f)) return 'Mon.';

  // Marrom -> Instr.
  if (/marrom/.test(f)) return 'Instr.';

  // Faixa Preta
  if (/preta/.test(f)) {
    // 3º–6º -> Prof.
    if (/\b(3|3o|3º|4|4o|4º|5|5o|5º|6|6o|6º)\b/.test(f)) return 'Prof.';
    // Lisa, 1º ou 2º -> Instr.
    if (/lisa/.test(f) || /\b(1|1o|1º|2|2o|2º)\b/.test(f)) return 'Instr.';
    return 'Instr.'; // sem grau: Instr.
  }

  // 7º (Vermelha e Preta) -> Mestre
  if (/vermelha\s*e\s*preta/.test(f) || /\b7\b/.test(f)) return 'M.';

  // 8º (Vermelha e Branca) -> Grande Mestre
  if (/vermelha\s*e\s*branca/.test(f) || /\b8\b/.test(f)) return 'G.M.';

  // 9º (Vermelha) -> Grão-Mestre
  if (/vermelha/.test(f) && /\b9\b/.test(f)) return 'G.M.';

  // 10º (Vermelha) -> Venerável Mestre
  if (/vermelha/.test(f) && /\b10\b/.test(f)) return 'V.M.';

  // 2) Fallback por TIPO explícito (permite exceções)
  if (tipoRaw === 'monitor' || tipoRaw === 'monitora' || tipoRaw === 'monitor(a)') return 'Mon.';
  if (tipoRaw.startsWith('instrut')) return 'Instr.';
  if (tipoRaw.startsWith('prof'))    return 'Prof.';

  // 3) Fallback geral
  return 'Colaborador';
}

function isAdmin(req){const s=req.headers['x-admin-secret'];return s && s===process.env.ADMIN_SECRET;}
function fmt(n){return (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}

async function sendEmail({to, subject, text}) {
  const apiKey = process.env.RESEND_API_KEY;
  if(!apiKey) throw new Error('RESEND_API_KEY não configurado');

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'Planck Kokoro <no-reply@planckkokoro.com>',
      to: [to],
      subject,
      text
    })
  });
  const data = await resp.json();
  if(!resp.ok) throw new Error(`Resend erro: ${resp.status} ${JSON.stringify(data)}`);
  return data;
}

function labelAux(p){
  const tipo   = String((p && p.tipo)   || '').toLowerCase();
  const faixa  = String((p && p.faixa)  || '').toLowerCase();
  const titular = !!(p && (p.eh_titular || p.is_titular));

  // 1) Titular tem prioridade
  if (titular) return 'Prof. Titular';

  // 2) Auxiliar com faixa
  if (tipo === 'auxiliar') {
    if (faixa === 'preta' || faixa === 'faixa preta' || faixa === 'black') {
      return 'Prof. Auxiliar';
    }
    if (faixa === 'marrom' || faixa === 'faixa marrom' || faixa === 'brown') {
      return 'Inst. Auxiliar';
    }
    // auxiliar sem faixa conhecida
    return 'Colaborador';
  }

  // 3) Demais casos
  return 'Colaborador';
}
  export default async function handler(req,res){
  if (req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,error:'Method not allowed'});}
  if (!isAdmin(req)) return res.status(401).json({ok:false,error:'unauthorized'});

  const { professor_id, valor_pago, metodo='PIX', pago_em, para_email, observacao } = req.body || {};
  if (!professor_id || !para_email || !(Number(valor_pago)>0)) {
    return res.status(400).json({ok:false,error:'professor_id, para_email e valor_pago são obrigatórios'});
  }

  const client = getClient(); await client.connect();
  try {
    const { rows: profRows } = await client.sql`
      SELECT id, nome, tipo, pix_chave, banco_nome, agencia, conta, favorecido_nome, doc_favorecido
      FROM professores WHERE id=${professor_id} LIMIT 1;`;
    if (!profRows.length) return res.status(404).json({ok:false,error:'Professor não encontrado'});
    const p = profRows[0];

    let orgPix = '—';
    try { const { rows: s } = await client.sql`SELECT value FROM settings WHERE key='org_pix_chave' LIMIT 1;`; orgPix = s[0]?.value || orgPix; } catch(_){}

    const dt = pago_em ? new Date(pago_em) : new Date();
    const dataBR = dt.toLocaleString('pt-BR',{ timeZone: 'America/Sao_Paulo' });

    const texto = [
      `Recibo de Repasse`,
      `Colaborador: ${ String((p.nome||"")).replace(/\s*\([^)]*\)\s*$/,"").trim() } (${labelTitle(p, (req.body || {}))})`,
      `Valor: ${fmt(valor_pago)}`,
      `Método: ${metodo}`,
      `Data/Hora: ${dataBR}`,
      `Obs.: ${ (observacao && observacao.trim()) || ('Repasse ' + new Date(pago_em || Date.now()).toLocaleDateString('pt-BR',{month:'2-digit',year:'numeric'})) }`,
      `—`,
      `PIX do colaborador: ${p.pix_chave || '—'}`,
      `Banco: ${p.banco_nome || '—'} / Ag.: ${p.agencia || '—'} / Conta: ${p.conta || '—'}`,
      `Favorecido: ${p.favorecido_nome || "—"} (${fmtDoc(p.doc_favorecido)})`,
      `—`,
      `Chave PIX - Planck Kokoro: ${orgPix}`
    ].filter(Boolean).join('\n');

    const envio = await sendEmail({ to: para_email, subject: 'Recibo de Repasse', text: texto });
    return res.json({ ok:true, email: envio, preview_texto: texto });
  } catch(e){
    return res.status(500).json({ok:false,error:String(e)});
  } finally {
    await client.end();
  }
}
