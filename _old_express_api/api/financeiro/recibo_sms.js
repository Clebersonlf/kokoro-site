import { getClient } from '../../lib/db.js';
function isAdmin(req){const s=req.headers['x-admin-secret'];return s && s===process.env.ADMIN_SECRET;}
function fmt(n){return (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}

async function sendSMS({to, body}) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_SMS; // ex: +1xxxxxxxxxx
  if(!sid || !token || !from) throw new Error('TWILIO_* não configurado');

  const params = new URLSearchParams();
  params.append('To', to);
  params.append('From', from);
  params.append('Body', body);

  const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });
  const data = await resp.json();
  if(!resp.ok) throw new Error(`Twilio erro: ${resp.status} ${JSON.stringify(data)}`);
  return data;
}

export default async function handler(req,res){
  if (req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,error:'Method not allowed'});}
  if (!isAdmin(req)) return res.status(401).json({ok:false,error:'unauthorized'});

  const { professor_id, valor_pago, metodo='PIX', pago_em, destino_sms, observacao } = req.body || {};
  if (!professor_id || !destino_sms || !(Number(valor_pago)>0)) {
    return res.status(400).json({ok:false,error:'professor_id, destino_sms e valor_pago são obrigatórios'});
  }

  const client = getClient(); await client.connect();
  try {
    const { rows: profRows } = await client.sql`
      SELECT id, nome, tipo, pix_chave
      FROM professores WHERE id=${professor_id} LIMIT 1;`;
    if (!profRows.length) return res.status(404).json({ok:false,error:'Professor não encontrado'});
    const p = profRows[0];

    const dt = pago_em ? new Date(pago_em) : new Date();
    const dataBR = dt.toLocaleString('pt-BR',{ timeZone: 'America/Sao_Paulo' });

    const texto = [
      `Recibo de Repasse`,
      `Colab: ${p.nome} (${p.tipo})`,
      `Valor: ${fmt(valor_pago)} | Método: ${metodo}`,
      `Quando: ${dataBR}`,
      observacao ? `Obs.: ${observacao}` : null
    ].filter(Boolean).join(' | ');

    const envio = await sendSMS({ to: destino_sms, body: texto });
    return res.json({ ok:true, sms: envio, preview_texto: texto });
  } catch(e){
    return res.status(500).json({ok:false,error:String(e)});
  } finally {
    await client.end();
  }
}
