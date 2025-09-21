#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
API_NEW="./api/financeiro/repasses_record.js"
UI="./admin/financeiro/repasses.html"
UNDO="UNDO_patch_repasses_persist_${TS}.sh"

# --- UNDO ---
cat > "$UNDO" <<EOF
#!/usr/bin/env bash
set -euo pipefail
[ -f "$API_NEW" ] && rm -f "$API_NEW" && echo " - removido: $API_NEW"
if [ -f "$UI.bak.$TS" ]; then mv -f "$UI.bak.$TS" "$UI" && echo " - restaurado: $UI"; fi
echo "OK: desfazido."
EOF
chmod +x "$UNDO"
echo ">> UNDO criado: ./$UNDO"

# --- 1) API: cria/atualiza endpoint de gravação ---
mkdir -p "$(dirname "$API_NEW")"
cat > "$API_NEW" <<'JS'
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
JS
echo " - API criada: $API_NEW"

# --- 2) UI: injeta bloco "Registrar no servidor" na /admin/financeiro/repasses.html ---
if [ -f "$UI" ]; then
  cp -f "$UI" "$UI.bak.$TS"
  python3 - "$UI" <<'PY'
import io,re,sys
p=sys.argv[1]
s=io.open(p,'r',encoding='utf-8').read()

panel = r"""
<!-- ========== Registrar no servidor (Repasses) ========== -->
<section class="card" id="kkr-registrar-repasse" style="margin-top:16px">
  <h2>Registrar Repasse no Servidor</h2>
  <div class="form-grid">
    <div class="form-group">
      <label for="kkr-prof-id">Professor ID (UUID)</label>
      <input id="kkr-prof-id" type="text" placeholder="ex.: baed8b13-f510-4c37-bd1e-60e809af1d93">
      <div class="hint">Pegue da lista de professores (ou do próprio recibo).</div>
    </div>
    <div class="form-group">
      <label for="kkr-base">Valor recebido (R$)</label>
      <input id="kkr-base" type="number" step="0.01" placeholder="ex.: 230">
    </div>
    <div class="form-group">
      <label for="kkr-pct">Repasse (%)</label>
      <input id="kkr-pct" type="number" step="0.0001" placeholder="ex.: 30">
    </div>
    <div class="form-group">
      <label for="kkr-repasse">Repasse (R$)</label>
      <input id="kkr-repasse" type="number" step="0.01" placeholder="ex.: 69">
      <div class="hint">Preencha % OU R$ — o outro é calculado.</div>
    </div>
    <div class="form-group">
      <label for="kkr-metodo">Método</label>
      <select id="kkr-metodo"><option>PIX</option><option>Dinheiro</option><option>Cartão</option><option>TED</option></select>
    </div>
    <div class="form-group">
      <label for="kkr-pago-em">Pago em</label>
      <input id="kkr-pago-em" type="datetime-local">
    </div>
    <div class="form-group" style="grid-column:1/-1">
      <label for="kkr-obs">Observação</label>
      <input id="kkr-obs" type="text" placeholder="Ex.: Repasse da turma 09/2025 – 3 aulas">
    </div>
    <div class="form-group" style="grid-column:1/-1">
      <label for="kkr-ref">Referência (única)</label>
      <input id="kkr-ref" type="text" placeholder="Se vazio, o sistema gera uma automaticamente">
      <div class="hint">Usada para evitar duplicidade. Se repetir, o registro é atualizado.</div>
    </div>
    <div class="form-actions" style="grid-column:1/-1; display:flex; gap:10px; justify-content:flex-end">
      <button type="button" class="btn btn-ghost" id="btn-set-secret">Configurar Admin Secret</button>
      <button type="button" class="btn btn-principal" id="btn-registrar-repasse">Registrar no servidor</button>
    </div>
    <div id="kkr-status" class="hint" style="grid-column:1/-1"></div>
  </div>
</section>

<script>
(function(){
  const $ = (q)=>document.querySelector(q);
  const getNum = (el)=>{ const v=parseFloat(el.value.replace(',','.')); return isFinite(v)?v:0; };
  const setNum = (el,val,dec=2)=>{ el.value = (isFinite(val)? val:0).toFixed(dec); };

  const SECRET_KEY = 'kkr_admin_secret';
  const getSecret = ()=> localStorage.getItem(SECRET_KEY)||'';
  const setSecret = ()=>{ const v=prompt('Cole seu ADMIN_SECRET'); if(v){ localStorage.setItem(SECRET_KEY,v); alert('OK: secret salvo no navegador.'); } };

  const base = $('#kkr-base'), pct = $('#kkr-pct'), rep = $('#kkr-repasse');

  // sincroniza % <-> R$
  pct.addEventListener('input', ()=>{ const b=getNum(base), p=getNum(pct); if(b>0){ setNum(rep, b*(p/100)); } });
  rep.addEventListener('input', ()=>{ const b=getNum(base), r=getNum(rep); if(b>0){ setNum(pct, (r/b)*100, 4); } });

  // tenta puxar valores da calculadora já existente (se tiver)
  try{
    const guessBase = document.querySelector('#valor-recebido, #calc-valor-recebido, [data-id="valor-recebido"]');
    const guessPct  = document.querySelector('#repasse-pct, #repasse-percent, [data-id="repasse-percent"]');
    const guessRep  = document.querySelector('#repasse-valor, #repasse-rs, [data-id="repasse-valor"]');
    if(guessBase && !base.value) base.value = guessBase.value || '';
    if(guessPct  && !pct.value)  pct.value  = guessPct.value || '';
    if(guessRep  && !rep.value)  rep.value  = guessRep.value || '';
  }catch(_){}

  // referência automática ao focar o campo se estiver vazio
  $('#kkr-ref').addEventListener('focus', ()=>{
    const r = $('#kkr-ref'); if(r.value) return;
    const pid = ($('#kkr-prof-id').value||'xxxx').slice(0,8);
    const b   = getNum(base), v = getNum(rep);
    const ym  = new Date().toISOString().slice(0,7).replace('-','');
    r.value = `rep-${ym}-${pid}-${Math.round(b*100)}-${Math.round(v*100)}`;
  });

  $('#btn-set-secret').addEventListener('click', setSecret);

  $('#btn-registrar-repasse').addEventListener('click', async ()=>{
    const status = $('#kkr-status'); status.textContent = 'Enviando...';
    const adminSecret = getSecret();
    if(!adminSecret){ alert('Configure o Admin Secret primeiro.'); status.textContent=''; return; }

    const payload = {
      professor_id: $('#kkr-prof-id').value.trim(),
      base_valor: getNum(base),
      percent: getNum(pct),
      repasse_valor: getNum(rep),
      metodo: $('#kkr-metodo').value,
      pago_em: $('#kkr-pago-em').value || null,
      observacao: $('#kkr-obs').value || null,
      referencia: $('#kkr-ref').value || null
    };
    if(!payload.professor_id){ alert('Informe o Professor ID'); status.textContent=''; return; }

    try{
      const resp = await fetch('/api/financeiro/repasses_record', {
        method:'POST',
        headers:{'Content-Type':'application/json','x-admin-secret':adminSecret},
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if(!resp.ok || !data.ok){ throw new Error(data.error||('HTTP '+resp.status)); }
      status.textContent = '✅ Registrado com sucesso (id '+data.repasse.id+').';
    }catch(e){
      status.textContent = '❌ Erro: '+ String(e.message||e);
    }
  });
})();
</script>
"""

# injeta o painel antes do fechamento do </body> (ou no fim do arquivo)
if '</body>' in s.lower():
    s = re.sub(r'</body>','%s\n</body>'%panel, s, flags=re.I)
else:
    s = s + '\n' + panel

io.open(p,'w',encoding='utf-8').write(s)
print(" - UI ajustada:", p)
PY
else
  echo "AVISO: não achei $UI (pulei patch de UI)"
fi

echo "OK."
