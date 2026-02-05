import { getClient } from '../../lib/db.js';

export default async function handler(req, res){
  try{
    if(req.method!=='POST'){ res.setHeader('Allow','POST'); return res.status(405).json({ok:false,error:'Method not allowed'}); }
    const secret = req.headers['x-admin-secret'];
    if(!secret || secret !== process.env.ADMIN_SECRET){ return res.status(401).json({ok:false,error:'unauthorized'}); }

    const body = req.body || {};
    // payload esperado (qualquer um dos pares abaixo pode vir que eu recalculo):
    // base_valor (total recebido), percent (0..100+), repasse_valor (valor para colaborador)
    // professor_id, metodo, pago_em, observacao, referencia (única p/ evitar duplicidade)
    let {
      professor_id, base_valor, percent, repasse_valor,
      metodo='PIX', pago_em, observacao, referencia
    } = body;

    if(!professor_id) return res.status(400).json({ok:false,error:'professor_id obrigatório'});
    base_valor = Number(base_valor||0);
    percent = (body.percent===0) ? 0 : Number(percent||NaN);
    repasse_valor = Number(repasse_valor||0);

    // Recalcula conforme o que veio
    if(!isFinite(percent) && base_valor>0){ percent = (repasse_valor>0) ? (repasse_valor/base_valor*100) : 0; }
    if(repasse_valor<=0 && isFinite(percent)){ repasse_valor = base_valor * (percent/100); }
    if(!isFinite(percent)) percent = 0;

    const quando = pago_em ? new Date(pago_em) : new Date();
    if(!referencia){
      const ym = new Date().toISOString().slice(0,7).replace('-','');
      referencia = `rep-${ym}-${professor_id}-${Math.round(base_valor*100)}-${Math.round(repasse_valor*100)}`;
    }

    const client = getClient(); await client.connect();
    try{
      // Tabela enxuta só p/ registrar repasses; usa UNIQUE por referência para não duplicar
      await client.sql`
        CREATE TABLE IF NOT EXISTS repasses (
          id BIGSERIAL PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          professor_id UUID NOT NULL,
          base_valor NUMERIC(12,2) NOT NULL DEFAULT 0,
          percent NUMERIC(7,4) NOT NULL DEFAULT 0,
          repasse_valor NUMERIC(12,2) NOT NULL DEFAULT 0,
          metodo TEXT NOT NULL DEFAULT 'PIX',
          pago_em TIMESTAMPTZ NOT NULL,
          observacao TEXT,
          referencia TEXT NOT NULL
        );`;
      await client.sql`CREATE UNIQUE INDEX IF NOT EXISTS repasses_ref_uniq ON repasses(referencia);`;

      const { rows } = await client.sql`
        INSERT INTO repasses (professor_id, base_valor, percent, repasse_valor, metodo, pago_em, observacao, referencia)
        VALUES (${professor_id}, ${base_valor}, ${percent}, ${repasse_valor}, ${metodo}, ${quando.toISOString()}, ${observacao||null}, ${referencia})
        ON CONFLICT (referencia) DO UPDATE SET
          professor_id=EXCLUDED.professor_id,
          base_valor=EXCLUDED.base_valor,
          percent=EXCLUDED.percent,
          repasse_valor=EXCLUDED.repasse_valor,
          metodo=EXCLUDED.metodo,
          pago_em=EXCLUDED.pago_em,
          observacao=EXCLUDED.observacao
        RETURNING *;`;

      return res.json({ ok:true, repasse: rows[0] });
    }catch(e){
      return res.status(500).json({ok:false,error:String(e)});
    }finally{
      await client.end();
    }
  }catch(err){
    return res.status(500).json({ok:false,error:String(err)});
  }
}
